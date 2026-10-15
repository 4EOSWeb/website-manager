import { z } from "zod";

export const flowLayoutSchema = z.object({
  mode: z.literal("flow"),
  direction: z.enum(["vertical", "horizontal"]),
  gap: z.number().min(0).max(200),
}).strict();
