import { z } from "zod";

/** Scope keys are fixed. The Prisma unique key stays as it is until a later step. */
export const draftScopeKeys = ["client", "website", "branch", "page", "user"] as const;

export const draftsSchema = z.object({
  scope: z.tuple([
    z.literal("client"),
    z.literal("website"),
    z.literal("branch"),
    z.literal("page"),
    z.literal("user"),
  ]),
  format: z.literal("visual-document-v1"),
}).strict();

export type DraftBehavior = z.infer<typeof draftsSchema>;
