import { z } from "zod";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";
import { workspacePath } from "./serialize";

const relativePath = z.string().min(1).refine((value) => workspacePath(value).ok, "Use a relative path.");

export const publicationSchema = z.object({
  mode: z.enum(["review-branch", "disabled"]),
  allowlist: z.array(relativePath),
}).strict();

export type PublicationBehavior = z.infer<typeof publicationSchema>;

export function validatePublication(supportsReviewPublishing: boolean, value: unknown): Result<PublicationBehavior> {
  const parsed = publicationSchema.safeParse(value);
  if (!parsed.success) return err(adapterInvalid("The publication settings are not valid.", "publish"));
  if (!supportsReviewPublishing && parsed.data.mode !== "disabled") {
    return err(adapterInvalid("Review publishing is not available for this site.", "publish.mode"));
  }
  if (parsed.data.mode === "review-branch" && parsed.data.allowlist.length === 0) {
    return err(adapterInvalid("Add at least one file to the review.", "publish.allowlist"));
  }
  return ok(parsed.data);
}
