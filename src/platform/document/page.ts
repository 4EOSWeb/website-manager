import { z } from "zod";
import { isPlatformId } from "../ids";

const sitePath = z.string().regex(/^\/[a-z0-9/-]*$/, "Use a path on this site.");

export const pageMetadataSchema = z.object({
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  shareImage: z.string().optional(),
});

export const pageSchema = z.object({
  id: z.string().refine((value) => isPlatformId(value) && value.startsWith("page_"), "Use a page id."),
  route: sitePath,
  title: z.string().min(1),
  metadata: pageMetadataSchema,
  root: z.unknown(),
});

export type PageDocumentV1 = z.infer<typeof pageSchema>;
