import { pgTable, serial, text, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";

export const articlesTable = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    guid: varchar("guid", { length: 512 }).notNull().unique(),
    headline: text("headline").notNull(),
    category: varchar("category", { length: 64 }).notNull().default("Top"),
    rawContent: text("raw_content").notNull(),
    bullets: jsonb("bullets").$type<string[]>().notNull(),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    publishedIdx: index("articles_published_idx").on(t.publishedAt),
    categoryIdx: index("articles_category_idx").on(t.category),
  }),
);

export type Article = typeof articlesTable.$inferSelect;
export type InsertArticle = typeof articlesTable.$inferInsert;
