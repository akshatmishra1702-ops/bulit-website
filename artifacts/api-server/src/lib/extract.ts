// Lightweight HTML → text extractor. No external scraping deps.
// Strips tags, scripts, styles, and collapses whitespace. Picks the
// largest <article>/<main> block when present, otherwise the body.

const BLOCK_TAGS = /<(article|main)[^>]*>([\s\S]*?)<\/\1>/gi;
const SCRIPT_RE = /<(script|style|noscript|iframe|svg)[^>]*>[\s\S]*?<\/\1>/gi;
const TAG_RE = /<[^>]+>/g;
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&rsquo;": "\u2019",
  "&lsquo;": "\u2018",
  "&rdquo;": "\u201D",
  "&ldquo;": "\u201C",
  "&hellip;": "\u2026",
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&[a-zA-Z]+;/g, (m) => ENTITIES[m] ?? "");
}

export function htmlToText(html: string): string {
  if (!html) return "";
  const cleaned = html.replace(SCRIPT_RE, " ");
  // Try to grab <article>/<main> body for a more focused chunk.
  let chunk = "";
  let largest = "";
  let m: RegExpExecArray | null;
  while ((m = BLOCK_TAGS.exec(cleaned)) !== null) {
    if ((m[2] ?? "").length > largest.length) largest = m[2] ?? "";
  }
  chunk = largest || cleaned;
  const text = decodeEntities(chunk.replace(TAG_RE, " "))
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

export function extractOgImage(html: string): string | null {
  if (!html) return null;
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m?.[1]) return m[1];
  }
  return null;
}

export async function fetchArticle(url: string): Promise<{ text: string; image: string | null }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BulItBot/1.0; +https://bulit.app/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return { text: "", image: null };
    const html = await res.text();
    return { text: htmlToText(html), image: extractOgImage(html) };
  } catch {
    return { text: "", image: null };
  }
}
