import { z } from "zod";

export const flexLayoutSchema = z.object({
  mode: z.literal("layout"),
  display: z.literal("flex"),
  direction: z.enum(["row", "column"]),
  gap: z.number().min(0).max(200),
  align: z.enum(["start", "center", "end", "stretch"]),
  justify: z.enum(["start", "center", "end", "between"]),
  wrap: z.boolean(),
}).strict();
