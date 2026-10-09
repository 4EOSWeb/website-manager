import { z } from "zod";

export const gridColumns = [1, 2, 3, 4, 6, 12] as const;

export const gridLayoutSchema = z.object({
  mode: z.literal("layout"),
  display: z.literal("grid"),
  columns: z.union(gridColumns.map((count) => z.literal(count))),
  gap: z.number().min(0).max(200),
  align: z.enum(["start", "center", "end", "stretch"]),
}).strict();
