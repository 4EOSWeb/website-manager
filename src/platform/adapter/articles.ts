import { z } from "zod";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

export const articlesSchema = z.object({
  enabled: z.boolean(),
  routePattern: z.string().min(1),
  body: z.enum(["structured", "html-preserved"]),
}).strict();

export type ArticleBehavior = z.infer<typeof articlesSchema>;

export function validateArticles(supportsBlog: boolean, value: unknown): Result<ArticleBehavior> {
  const parsed = articlesSchema.safeParse(value);
  if (!parsed.success) return err(adapterInvalid("The article settings are not valid.", "articles"));
  if (parsed.data.enabled !== supportsBlog) {
    return err(adapterInvalid("Article support must match the site capability.", "articles.enabled"));
  }
  return ok(parsed.data);
}

/** Callers ignore the pattern while articles are disabled. */
export function activeArticlePattern(articles: ArticleBehavior): string | null {
  return articles.enabled ? articles.routePattern : null;
}
