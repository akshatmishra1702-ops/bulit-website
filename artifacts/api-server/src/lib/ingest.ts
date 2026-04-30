import Parser from "rss-parser";
import crypto from "node:crypto";
import { db, articlesTable } from "@workspace/db";
import { sql, isNull, eq } from "drizzle-orm";
import { FEEDS, type FeedSource } from "./feeds";
import { fetchArticle } from "./extract";
import { summarizeToBullets } from "./summarize";
import { logger } from "./logger";

type Item = {
  guid?: string;
  link?: string;
  title?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  ["content:encoded"]?: string;
  enclosure?: { url?: string };
  ["media:content"]?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  ["media:thumbnail"]?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
};

const parser = new Parser<unknown, Item>({
  timeout: 12000,
  customFields: {
    item: [
      ["content:encoded", "content:encoded"],
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
    ],
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; BulItBot/1.0; +https://bulit.app/bot)",
  },
});

function makeGuid(item: Item): string {
  if (item.guid) return item.guid;
  if (item.link) return item.link;
  return crypto.createHash("sha1").update((item.title ?? "") + (item.pubDate ?? "")).digest("hex");
}

function extractImage(item: Item): string | null {
  const mc = item["media:content"];
  if (Array.isArray(mc)) {
    const u = mc[0]?.$?.url;
    if (u) return u;
  } else if (mc && mc.$?.url) return mc.$.url;
  const mt = item["media:thumbnail"];
  if (Array.isArray(mt)) {
    const u = mt[0]?.$?.url;
    if (u) return u;
  } else if (mt && mt.$?.url) return mt.$.url;
  if (item.enclosure?.url) return item.enclosure.url;
  // Try to pull first <img src> from content
  const html = item["content:encoded"] ?? item.content ?? "";
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return m?.[1] ?? null;
}

async function existingGuids(guids: string[]): Promise<Set<string>> {
  if (guids.length === 0) return new Set();
  const rows = await db
    .select({ guid: articlesTable.guid })
    .from(articlesTable)
    .where(sql`${articlesTable.guid} IN (${sql.join(guids.map((g) => sql`${g}`), sql`, `)})`);
  return new Set(rows.map((r) => r.guid));
}

async function ingestFeed(feed: FeedSource, perFeedLimit: number): Promise<number> {
  let added = 0;
  let parsed: { items: Item[] };
  try {
    parsed = (await parser.parseURL(feed.url)) as unknown as { items: Item[] };
  } catch (err) {
    logger.warn({ err, url: feed.url }, "feed parse failed");
    return 0;
  }
  const items = (parsed.items ?? []).slice(0, perFeedLimit);
  if (items.length === 0) return 0;
  const guids = items.map(makeGuid);
  const seen = await existingGuids(guids);
  const fresh = items.filter((it, i) => !seen.has(guids[i]!));

  for (const item of fresh) {
    const guid = makeGuid(item);
    const headline = (item.title ?? "").trim();
    if (!headline) continue;
    const link = item.link ?? "";
    const fallbackBody = (item["content:encoded"] ?? item.content ?? item.contentSnippet ?? "").trim();
    let body = "";
    let pageImage: string | null = null;
    if (link) {
      const fetched = await fetchArticle(link);
      body = fetched.text;
      pageImage = fetched.image;
    }
    if (body.length < 400 && fallbackBody) body = fallbackBody;
    const bullets = await summarizeToBullets(headline, body);
    if (bullets.length === 0) {
      logger.warn({ guid, headline }, "no bullets generated, skipping");
      continue;
    }
    const publishedAt = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date();
    try {
      await db
        .insert(articlesTable)
        .values({
          guid,
          headline,
          category: feed.category,
          rawContent: body.slice(0, 20000),
          bullets,
          imageUrl: extractImage(item) ?? pageImage,
          publishedAt,
        })
        .onConflictDoNothing({ target: articlesTable.guid });
      added++;
    } catch (err) {
      logger.error({ err, guid }, "insert failed");
    }
  }
  return added;
}

let running = false;

export async function runIngestCycle(perFeedLimit = 6): Promise<void> {
  if (running) return;
  running = true;
  const startedAt = Date.now();
  let total = 0;
  try {
    for (const feed of FEEDS) {
      const added = await ingestFeed(feed, perFeedLimit);
      total += added;
    }
    logger.info({ total, ms: Date.now() - startedAt }, "ingest cycle complete");
  } finally {
    running = false;
  }
}

async function backfillImages(): Promise<void> {
  const rows = await db
    .select({ id: articlesTable.id, guid: articlesTable.guid })
    .from(articlesTable)
    .where(isNull(articlesTable.imageUrl))
    .limit(200);
  const candidates = rows.filter((r) => /^https?:\/\//i.test(r.guid));
  if (candidates.length === 0) return;
  let updated = 0;
  for (const r of candidates) {
    const { image } = await fetchArticle(r.guid);
    if (image) {
      await db.update(articlesTable).set({ imageUrl: image }).where(eq(articlesTable.id, r.id));
      updated++;
    }
  }
  logger.info({ updated, scanned: candidates.length }, "image backfill complete");
}

export function startIngestLoop(): void {
  setTimeout(() => {
    void backfillImages().catch((err) => logger.warn({ err }, "backfill failed"));
  }, 2000);
  // First cycle quickly with a smaller per-feed limit so the UI fills up fast.
  setTimeout(() => {
    void runIngestCycle(3).then(() => {
      // Then full cycles every 4 minutes forever.
      const tick = () => {
        void runIngestCycle(6).finally(() => {
          setTimeout(tick, 4 * 60 * 1000);
        });
      };
      setTimeout(tick, 30 * 1000);
    });
  }, 1000);
}
