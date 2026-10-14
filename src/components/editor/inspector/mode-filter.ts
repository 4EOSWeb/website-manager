export type InspectorTier = "basic" | "advanced" | "administrator";

export type InspectorField =
  | "label"
  | "href"
  | "imageReplace"
  | "duplicate"
  | "delete"
  | "strategy"
  | "zIndex"
  | "position"
  | "componentId"
  | "adapterPath"
  | "lockId"
  | "providerManaged"
  | "embedUrl";

const tiers: Record<InspectorField, InspectorTier> = {
  label: "basic",
  href: "basic",
  imageReplace: "basic",
  duplicate: "basic",
  delete: "basic",
  strategy: "advanced",
  zIndex: "advanced",
  position: "advanced",
  componentId: "administrator",
  adapterPath: "administrator",
  lockId: "administrator",
  providerManaged: "administrator",
  embedUrl: "administrator",
};

export function fieldTier(field: InspectorField): InspectorTier {
  return tiers[field];
}

/** Basic shows only basic fields. Advanced adds layout detail. Administrator adds the rest. */
export function fieldVisible(field: InspectorField, experience: string): boolean {
  const tier = tiers[field];
  if (experience === "administrator") return true;
  if (experience === "advanced") return tier !== "administrator";
  return tier === "basic";
}
