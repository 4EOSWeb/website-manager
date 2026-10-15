import { z } from "zod";

const jsonLiteral = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() => z.union([jsonLiteral, z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)]));

function depth(value: unknown, level = 1): number {
  if (value === null || typeof value !== "object") return level;
  const children = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
  return children.reduce((max, child) => Math.max(max, depth(child, level + 1)), level);
}

export const propsSchema = z.record(z.string(), jsonValueSchema).refine((value) => depth(value) <= 6, "Props are nested too deeply.");
