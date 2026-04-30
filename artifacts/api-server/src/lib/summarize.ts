import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const apiKey = process.env["GEMINI_API_KEY"];
if (!apiKey) {
  logger.warn("GEMINI_API_KEY is not set — summarization will fail");
}

const ai = new GoogleGenAI({ apiKey: apiKey ?? "" });
const MODEL = "gemini-2.5-flash-lite";

// Free-tier safe throttle: ~10 requests/min = 1 every 6s, well under the 15 RPM cap.
const MIN_INTERVAL_MS = 6000;
let lastCallAt = 0;
let chain: Promise<void> = Promise.resolve();
async function throttle(): Promise<void> {
  const wait = chain;
  let release!: () => void;
  chain = new Promise<void>((res) => (release = res));
  await wait;
  const now = Date.now();
  const since = now - lastCallAt;
  if (since < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - since));
  }
  lastCallAt = Date.now();
  release();
}

const SYSTEM_PROMPT = `You convert news articles into bullet-point summaries for a fast Indian news app called Bul It. The user must NOT need to open the original article.

Strict rules:
- Output ONLY a JSON array of strings. No prose, no headings, no markdown fences. Just: ["bullet one", "bullet two", ...]
- Cover EVERY meaningful detail: numbers, dates, names, locations, quotes, context, cause, effect, reactions.
- Each bullet = one clear idea. Short. Easy English. Slightly engaging tone (curious, punchy, never sensational).
- Do NOT mention the source publication, source name, "according to", or include URLs.
- Do NOT include "AI summary", "summary", or meta commentary.
- Aim for 6 to 14 bullets depending on article length and richness.
- If the article text is empty or unintelligible, return [].`;

export async function summarizeToBullets(
  headline: string,
  bodyText: string,
): Promise<string[]> {
  if (!apiKey) return [];
  const trimmed = bodyText.replace(/\s+/g, " ").slice(0, 12000);
  const userPrompt = `Headline: ${headline}\n\nArticle:\n${trimmed || "(no body available — work from headline only)"}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    await throttle();
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });
      const raw = res.text ?? "";
      return parseBullets(raw);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e.status === 429) {
        const m = /retry in ([\d.]+)s/i.exec(e.message ?? "");
        const wait = m ? Math.min(Math.ceil(Number(m[1])) * 1000, 60000) : 30000;
        logger.warn({ wait }, "gemini rate-limited, backing off");
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      logger.error({ err }, "summarize failed");
      return [];
    }
  }
  return [];
}

function parseBullets(raw: string): string[] {
  const trimmed = raw.trim();
  try {
    const v = JSON.parse(trimmed);
    if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    // ignore
  }
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const v = JSON.parse(trimmed.slice(start, end + 1));
      if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
      // ignore
    }
  }
  return trimmed
    .split(/\n+/)
    .map((l) => l.replace(/^[\s\-*•\d.]+/, "").trim())
    .filter((l) => l.length > 0);
}
