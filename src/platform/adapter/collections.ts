import { z } from "zod";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

const collectionId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const collectionSchema = z
  .object({
    id: z.string().regex(collectionId),
    name: z.string().trim().min(1).max(40),
    kind: z.enum(["article", "forum"]),
    routePattern: z.string().min(1).refine((value) => value.includes(":slug"), "A collection address needs :slug."),
    body: z.enum(["structured", "html-preserved"]),
  })
  .strict();

export const collectionsSchema = z.array(collectionSchema).max(12);

export type ContentCollection = z.infer<typeof collectionSchema>;

/** Optional. An empty list means the site uses its article pattern alone. */
export function validateCollections(supportsBlog: boolean, value: unknown): Result<ContentCollection[]> {
  if (value === undefined) return ok([]);
  const parsed = collectionsSchema.safeParse(value);
  if (!parsed.success) return err(adapterInvalid("The content collections are not valid.", "collections"));
  const ids = new Set<string>();
  const routes = new Set<string>();
  for (const item of parsed.data) {
    if (ids.has(item.id)) return err(adapterInvalid("Each collection needs its own id.", `collections.${item.id}`));
    if (routes.has(item.routePattern)) return err(adapterInvalid("Each collection needs its own address.", `collections.${item.id}`));
    ids.add(item.id);
    routes.add(item.routePattern);
    if (item.kind === "article" && !supportsBlog) {
      return err(adapterInvalid("Article collections require the article capability.", `collections.${item.id}`));
    }
  }
  return ok(parsed.data);
}
