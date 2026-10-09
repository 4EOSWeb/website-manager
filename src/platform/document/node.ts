import { z } from "zod";
import { isPlatformId } from "../ids";
import { nodeTypeSchema } from "./node-type";
import { propsSchema } from "./props";
import { stylesSchema } from "./styles";
import { responsiveSchema } from "./responsive";
import { visibilitySchema } from "./visibility";
import { lockingSchema } from "./locking";
import { sourceSchema } from "./source";
import { bindingsSchema } from "./bindings";

export const nodeSchema = z.object({
  id: z.string().refine((value) => isPlatformId(value) && (value.startsWith("node_") || value.startsWith("grp_")), "Use a node id."),
  type: nodeTypeSchema,
  componentId: z.string().min(1),
  props: propsSchema,
  styles: stylesSchema,
  responsive: responsiveSchema,
  children: z.array(z.unknown()),
  visibility: visibilitySchema,
  locked: lockingSchema,
  metadata: z.record(z.string(), z.unknown()),
  layout: z.unknown().optional(),
  bindings: bindingsSchema.optional(),
  source: sourceSchema.optional(),
});

export type NodeDocument = z.infer<typeof nodeSchema>;
