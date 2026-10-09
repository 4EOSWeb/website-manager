import { z } from "zod";
import { isPlatformId } from "../ids";
import { nodeTypeSchema } from "./node-type";

export const nodeSchema = z.object({
  id: z.string().refine((value) => isPlatformId(value) && (value.startsWith("node_") || value.startsWith("grp_")), "Use a node id."),
  type: nodeTypeSchema,
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
