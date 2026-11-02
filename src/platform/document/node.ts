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
import { layoutSchema } from "./layout";
import { canvasBoxSchema } from "./canvas-box";

type NodeShape = {
  id: string;
  type: z.infer<typeof nodeTypeSchema>;
  componentId: string;
  props: z.infer<typeof propsSchema>;
  styles: z.infer<typeof stylesSchema>;
  responsive: z.infer<typeof responsiveSchema>;
  children: NodeShape[];
  visibility: z.infer<typeof visibilitySchema>;
  locked: z.infer<typeof lockingSchema>;
  metadata: Record<string, unknown>;
  layout?: z.infer<typeof layoutSchema>;
  box?: z.infer<typeof canvasBoxSchema>;
  bindings?: z.infer<typeof bindingsSchema>;
  source?: z.infer<typeof sourceSchema>;
};

function treeDepth(node: { children?: unknown[] }, level = 1): number {
  const children = Array.isArray(node.children) ? node.children : [];
  return children.reduce<number>((deepest, child) => {
    if (child && typeof child === "object") return Math.max(deepest, treeDepth(child as { children?: unknown[] }, level + 1));
    return deepest;
  }, level);
}

export const nodeSchema: z.ZodType<NodeShape> = z.lazy(() =>
  z.object({
    id: z.string().refine((value) => isPlatformId(value) && (value.startsWith("node_") || value.startsWith("grp_")), "Use a node id."),
    type: nodeTypeSchema,
    componentId: z.string().min(1),
    props: propsSchema,
    styles: stylesSchema,
    responsive: responsiveSchema,
    children: z.array(nodeSchema).max(80),
    visibility: visibilitySchema,
    locked: lockingSchema,
    metadata: z.record(z.string(), z.unknown()),
    layout: layoutSchema.optional(),
    box: canvasBoxSchema.optional(),
    bindings: bindingsSchema.optional(),
    source: sourceSchema.optional(),
  }).refine((node) => treeDepth(node) <= 12, "A page cannot nest more than 12 levels."),
);

export type NodeDocument = z.infer<typeof nodeSchema>;
