import { z } from "zod";

const breakpointIds = ["desktop", "tablet", "mobile"] as const;

const breakpointSchema = z.object({
  id: z.enum(breakpointIds),
  width: z.number().min(320).max(1920),
  label: z.string().min(1),
}).strict();

export const breakpointsSchema = z.object({
  breakpoints: z.array(breakpointSchema).length(3),
}).strict().superRefine((value, ctx) => {
  const ids = value.breakpoints.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", message: "Each breakpoint is listed once.", path: ["breakpoints"] });
  }
  for (const id of breakpointIds) {
    if (!ids.includes(id)) ctx.addIssue({ code: "custom", message: "Desktop, tablet, and mobile are required.", path: ["breakpoints"] });
  }
});

export type AdapterBreakpoints = z.infer<typeof breakpointsSchema>;
