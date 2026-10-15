import { z } from "zod";

const breakpoints = ["desktop", "tablet", "mobile"] as const;

export const visibilitySchema = z.object({
  hidden: z.boolean(),
  hideOn: z.array(z.enum(breakpoints)).refine((values) => new Set(values).size === values.length, "Name each breakpoint once."),
});
