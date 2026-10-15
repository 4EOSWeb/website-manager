import { z } from "zod";
import { canvasLayoutSchema } from "./layout-canvas";
import { flexLayoutSchema } from "./layout-flex";
import { gridLayoutSchema } from "./layout-grid";
import { flowLayoutSchema } from "./layout-flow";

const layoutCoreSchema = z.union([flowLayoutSchema, flexLayoutSchema, gridLayoutSchema, canvasLayoutSchema]);

function stripNestedPrevious(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (!record.previous || typeof record.previous !== "object") return value;
  const previous = { ...(record.previous as Record<string, unknown>) };
  delete previous.previous;
  return { ...record, previous };
}

const layoutWithPrevious = z.union([
  flowLayoutSchema.extend({ previous: layoutCoreSchema.optional() }),
  flexLayoutSchema.extend({ previous: layoutCoreSchema.optional() }),
  gridLayoutSchema.extend({ previous: layoutCoreSchema.optional() }),
  canvasLayoutSchema.extend({ previous: layoutCoreSchema.optional() }),
]);

export const layoutSchema = z.preprocess(stripNestedPrevious, layoutWithPrevious);

export type LayoutSettings = z.infer<typeof layoutWithPrevious>;

export function switchLayout<T extends { layout?: LayoutSettings }>(node: T, next: LayoutSettings): Omit<T, "layout"> & { layout: LayoutSettings } {
  const nextCore = { ...next };
  delete nextCore.previous;
  if (!node.layout) return { ...node, layout: nextCore as LayoutSettings };
  const previous = { ...node.layout };
  delete previous.previous;
  return { ...node, layout: { ...nextCore, previous } as LayoutSettings };
}
