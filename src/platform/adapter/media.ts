import { z } from "zod";

const relativeDir = z.string().min(1).refine((value) => {
  if (value.startsWith("/") || value.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(value)) return false;
  return !value.split(/[\\/]/).includes("..");
}, "Use a relative path.");

const imageExtension = z.enum([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]);

export const mediaSchema = z.object({
  storage: z.enum(["git", "external"]),
  publicDir: relativeDir,
  accept: z.array(imageExtension),
}).strict();

export type MediaBehavior = z.infer<typeof mediaSchema>;
