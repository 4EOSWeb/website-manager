import { z } from "zod";
import type { AdapterLevel } from "./level";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

export const fontSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,32}$/),
  family: z.string().min(1).max(80),
  category: z.enum(["serif", "sans", "mono"]),
  source: z.enum(["system", "file"]),
}).strict();

export const fontsSchema = z.object({
  fonts: z.array(fontSchema),
}).strict();

export type AdapterFonts = z.infer<typeof fontsSchema>;

export function validateFonts(level: AdapterLevel, value: unknown): Result<AdapterFonts> {
  const parsed = fontsSchema.safeParse(value);
  if (!parsed.success) return err(adapterInvalid("The font list is not valid.", "fonts"));
  if (level === 2 && parsed.data.fonts.length === 0) {
    return err(adapterInvalid("Level 2 needs at least one font.", "fonts"));
  }
  return ok(parsed.data);
}
