import { z } from "zod";
import { documentInvalid } from "../errors";
import { err, ok, type Result } from "../result";
import { nodeSchema, type NodeDocument } from "./node";
import { pageSchema, type PageDocumentV1 } from "./page";

export const themeOverridesSchema = z.record(z.string().min(1).max(80), z.string().max(200));

export const visualDocumentSchema = z.object({
  version: z.literal(1),
  pages: z.array(pageSchema).min(1),
  themeOverrides: themeOverridesSchema.optional(),
}).strict();

export type VisualPage = Omit<PageDocumentV1, "root"> & { root: NodeDocument };

export type VisualDocument = {
  version: 1;
  pages: VisualPage[];
  themeOverrides?: Record<string, string>;
};

function remember(id: string, ids: Set<string>): boolean {
  if (ids.has(id)) return false;
  ids.add(id);
  return true;
}

function rememberTree(node: NodeDocument, ids: Set<string>): boolean {
  if (!remember(node.id, ids)) return false;
  return node.children.every((child) => rememberTree(child, ids));
}

export function validateDocument(value: unknown): Result<VisualDocument> {
  const parsed = visualDocumentSchema.safeParse(value);
  if (!parsed.success) return err(documentInvalid());
  const ids = new Set<string>();
  const pages: VisualPage[] = [];
  for (const page of parsed.data.pages) {
    if (!remember(page.id, ids)) return err(documentInvalid("Each item needs its own id."));
    const root = nodeSchema.safeParse(page.root);
    if (!root.success) return err(documentInvalid());
    if (!rememberTree(root.data, ids)) return err(documentInvalid("Each item needs its own id."));
    pages.push({ ...page, root: root.data });
  }
  return ok({ version: 1, pages, themeOverrides: parsed.data.themeOverrides });
}
