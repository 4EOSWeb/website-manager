import { z } from "zod";

const relativeRoot = z.string().min(1).refine((value) => {
  if (value.startsWith("/") || value.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(value)) return false;
  return !value.split(/[\\/]/).includes("..");
}, "Use a relative path.");

export const routerSchema = z.object({
  kind: z.enum(["app", "pages"]),
  root: relativeRoot,
}).strict();

export type AdapterRouter = z.infer<typeof routerSchema>;
