import { Router, type IRouter } from "express";
import { db, articlesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import {
  ListNewsQueryParams,
  ListNewsResponse,
  GetNewsArticleParams,
  GetNewsArticleResponse,
  ListCategoriesResponse,
} from "@workspace/api-zod";
import { CATEGORIES } from "../lib/feeds";

const router: IRouter = Router();

router.get("/news/categories", (_req, res) => {
  const data = ListCategoriesResponse.parse(CATEGORIES);
  res.json(data);
});

router.get("/news", async (req, res) => {
  const parsed = ListNewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid query" });
    return;
  }
  const { category, limit } = parsed.data;
  const where =
    category && category !== "Top"
      ? and(eq(articlesTable.category, category))
      : undefined;
  const rows = await db
    .select()
    .from(articlesTable)
    .where(where)
    .orderBy(desc(articlesTable.publishedAt))
    .limit(Math.min(Math.max(limit, 1), 200));
  const data = ListNewsResponse.parse(
    rows.map((r) => ({
      id: r.id,
      headline: r.headline,
      category: r.category,
      bullets: r.bullets,
      imageUrl: r.imageUrl,
      publishedAt: r.publishedAt,
      processedAt: r.processedAt,
    })),
  );
  res.json(data);
});

router.get("/news/:id", async (req, res) => {
  const parsed = GetNewsArticleParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const id = parsed.data.id;
  const [row] = await db.select().from(articlesTable).where(eq(articlesTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const data = GetNewsArticleResponse.parse({
    id: row.id,
    headline: row.headline,
    category: row.category,
    bullets: row.bullets,
    imageUrl: row.imageUrl,
    publishedAt: row.publishedAt,
    processedAt: row.processedAt,
  });
  res.json(data);
});

export default router;
