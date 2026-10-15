import { z } from "zod";

export const canvasLayoutSchema = z.object({
  mode: z.literal("canvas"),
  snap: z.number().min(0).max(32),
  showGrid: z.boolean(),
}).strict();
