export const capabilityNames = [
  "supportsPageCreation",
  "supportsBlog",
  "supportsNavigationEditing",
  "supportsFreeCanvas",
  "supportsStructuredSections",
  "supportsThemeEditing",
  "supportsCustomComponents",
  "supportsForms",
  "supportsSharedLayouts",
  "supportsReviewPublishing",
] as const;

export type CapabilityName = (typeof capabilityNames)[number];

export type CapabilityFlags = Partial<Record<CapabilityName, boolean>>;

export function hasCapability(flags: CapabilityFlags, name: CapabilityName): boolean {
  return flags[name] === true;
}
