import { z } from "zod";

export const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  componentId: z.string().min(1),
  props: z.record(z.string(), z.unknown()),
  styles: z.record(z.string(), z.unknown()),
  responsive: z.record(z.string(), z.unknown()),
  children: z.array(z.unknown()),
  visibility: z.unknown(),
  locked: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  layout: z.unknown().optional(),
  bindings: z.unknown().optional(),
  source: z.unknown().optional(),
});

export type NodeDocument = z.infer<typeof nodeSchema>;
