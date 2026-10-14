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

/** Basic shows only basic fields. Advanced adds layout detail. Administrator fields also require an admin role. */
export function fieldVisible(field: InspectorField, experience: string, canAdminister = false): boolean {
  const tier = tiers[field];
  if (tier === "administrator") return experience === "administrator" && canAdminister;
  if (experience === "administrator" || experience === "advanced") return true;
  return tier === "basic";
}

/** Fields the current experience is allowed to render. */
export function visibleFields(experience: string, canAdminister = false): InspectorField[] {
  return (Object.keys(tiers) as InspectorField[]).filter((field) => fieldVisible(field, experience, canAdminister));
}

/** Labels that would be rendered. An empty list means the client HTML has none of these fields. */
export function adminLabels(experience: string, canAdminister: boolean, embed: boolean): string[] {
  if (!fieldVisible("componentId", experience, canAdminister)) return [];
  const labels = ["Adapter id", "Component id", "Lock id", "Provider-managed"];
  if (embed && fieldVisible("embedUrl", experience, canAdminister)) labels.push("Embed URL");
  return labels;
}
