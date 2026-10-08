import { z } from "zod";

export const editorManifestSchema = z.object({
  websiteId: z.string(),
  name: z.string(),
  productionUrl: z.string().url(),
  github: z.object({
    owner: z.string(),
    repository: z.string(),
  }),
  azureDeploymentIdentifier: z.string().nullable(),
  packageManager: z.literal("npm"),
  installCommand: z.literal("npm ci"),
  devCommand: z.literal("npm run dev"),
  buildCommand: z.literal("npm run build"),
  defaultBranch: z.literal("main"),
  routes: z.array(
    z.object({
      path: z.string(),
      title: z.string(),
      editable: z.boolean(),
    }),
  ),
  lockedComponents: z.array(z.string()),
  freeformComponents: z.array(z.string()),
  blog: z.object({
    collection: z.literal("insights"),
    format: z.literal("structured-json"),
  }),
  media: z.literal("git"),
  viewports: z.array(
    z.object({
      id: z.enum(["mobile", "tablet", "desktop"]),
      width: z.number(),
    }),
  ),
});

export type EditorManifest = z.infer<typeof editorManifestSchema>;

export function parseManifest(value: unknown): EditorManifest {
  return editorManifestSchema.parse(value);
}
