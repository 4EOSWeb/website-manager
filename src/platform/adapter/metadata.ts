import { z } from "zod";

export const siteMetadataSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  productionUrl: z.string().url(),
  repository: z.object({
    owner: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }).strict(),
  defaultBranch: z.string().trim().min(1),
}).strict();

export type SiteMetadata = z.infer<typeof siteMetadataSchema>;
