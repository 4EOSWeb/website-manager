const presetComponents: Record<string, string> = {
  hero: "quantum-age.hero",
  audience: "quantum-age.card",
  who: "quantum-age.card",
  solutions: "quantum-age.card",
  formula: "quantum-age.card",
  team: "quantum-age.card",
  references: "quantum-age.card",
  insights: "quantum-age.insights-summary",
  cta: "quantum-age.button",
};

/** Maps a version 3 preset section to a site component. Other sections return null. */
export function migrateSection(section: Record<string, unknown>): { componentId: string } | null {
  if (section.type !== "preset" || typeof section.preset !== "string") return null;
  const componentId = presetComponents[section.preset];
  return componentId ? { componentId } : null;
}
