import { z } from "zod";

const relativeRoot = z.string().min(1).refine((value) => {
  if (value.startsWith("/") || value.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(value)) return false;
  return !value.split(/[\\/]/).includes("..");
}, "Use a relative path.");

/** Where the site's Next app lives, relative to the hub. Absent sites keep the cloned workspace. */
export const workspaceSchema = z.object({
  root: relativeRoot,
}).strict();

export type AdapterWorkspace = z.infer<typeof workspaceSchema>;
