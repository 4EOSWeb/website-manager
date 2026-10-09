import { z } from "zod";
import type { AdapterLevel } from "./level";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

export const adapterCapabilitiesSchema = z.object({
  supportsPageCreation: z.boolean(),
  supportsBlog: z.boolean(),
  supportsNavigationEditing: z.boolean(),
  supportsFreeCanvas: z.boolean(),
  supportsStructuredSections: z.boolean(),
  supportsThemeEditing: z.boolean(),
  supportsCustomComponents: z.boolean(),
  supportsForms: z.boolean(),
  supportsSharedLayouts: z.boolean(),
  supportsReviewPublishing: z.boolean(),
}).strict();

export type AdapterCapabilities = z.infer<typeof adapterCapabilitiesSchema>;

const closedOnLevel1 = ["supportsFreeCanvas", "supportsPageCreation", "supportsCustomComponents"] as const;

export function validateAdapterCapabilities(level: AdapterLevel, value: unknown): Result<AdapterCapabilities> {
  const parsed = adapterCapabilitiesSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] ? String(issue.path[0]) : "";
    return err(adapterInvalid("Every capability must be set.", field ? `capabilities.${field}` : "capabilities"));
  }
  if (level === 1) {
    for (const name of closedOnLevel1) {
      if (parsed.data[name]) return err(adapterInvalid("Level 1 cannot enable that capability.", `capabilities.${name}`));
    }
  }
  return ok(parsed.data);
}
