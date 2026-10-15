import { z } from "zod";
import type { CapabilityFlags } from "../capabilities";

/** Level 1 exposes text, links, and images only. Level 2 is the full builder. */
export const adapterLevelSchema = z.union([z.literal(1), z.literal(2)]);

export type AdapterLevel = z.infer<typeof adapterLevelSchema>;

/** Minimum capability flags for an integration level. Level 1 cannot open the full builder. */
export function levelCapabilities(level: AdapterLevel): CapabilityFlags {
  if (level === 1) {
    return {
      supportsPageCreation: false,
      supportsBlog: false,
      supportsNavigationEditing: false,
      supportsFreeCanvas: false,
      supportsStructuredSections: false,
      supportsThemeEditing: false,
      supportsCustomComponents: false,
      supportsForms: false,
      supportsSharedLayouts: false,
      supportsReviewPublishing: false,
    };
  }
  return {
    supportsPageCreation: true,
    supportsBlog: true,
    supportsNavigationEditing: true,
    supportsFreeCanvas: true,
    supportsStructuredSections: true,
    supportsThemeEditing: true,
    supportsCustomComponents: true,
    supportsForms: true,
    supportsSharedLayouts: true,
    supportsReviewPublishing: true,
  };
}
