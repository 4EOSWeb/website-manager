import { z } from "zod";

const componentId = z.string().regex(/^[a-z0-9.-]+$/);

const thumbnailSchema = z.string().min(1).refine((value) => {
  if (value === "none") return true;
  if (value.includes("://") || value.startsWith("//") || value.startsWith("/") || value.startsWith("\\")) return false;
  return !value.split(/[\\/]/).includes("..");
}, "Use a relative asset id.");

export const componentDefinitionSchema = z.object({
  id: componentId,
  name: z.string().min(1),
  category: z.string().min(1),
  thumbnail: thumbnailSchema,
  defaultProps: z.record(z.string(), z.unknown()),
  propsSchemaId: z.string().min(1),
  inspector: z.string().min(1),
  acceptsChildren: z.boolean(),
  allowedParents: z.array(z.string().min(1)),
  capabilities: z.record(z.string(), z.boolean()),
  locking: z.object({
    locked: z.boolean(),
    lockId: z.string().regex(/^[a-z0-9.-]{1,64}$/).optional(),
  }).strict(),
  renderer: z.object({
    exportName: z.string().min(1),
  }).strict(),
}).strict();

export const componentsSchema = z.object({
  components: z.array(componentDefinitionSchema),
}).strict();

export type AdapterComponents = z.infer<typeof componentsSchema>;
