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

const textKinds: Record<string, { type: "heading" | "text" | "richtext"; role?: string }> = {
  heading: { type: "heading" },
  eyebrow: { type: "heading", role: "eyebrow" },
  paragraph: { type: "text" },
  quote: { type: "richtext" },
};

/** Maps a version 3 text block. Eyebrow stays a heading with a role, not a platform kind. */
export function migrateText(block: Record<string, unknown>): { type: "heading" | "text" | "richtext"; role?: string } | null {
  if (typeof block.kind !== "string") return null;
  return textKinds[block.kind] ?? null;
}

/** Maps a version 3 preset section to a site component. Other sections return null. */
export function migrateSection(section: Record<string, unknown>): { componentId: string } | null {
  if (section.type !== "preset" || typeof section.preset !== "string") return null;
  const componentId = presetComponents[section.preset];
  return componentId ? { componentId } : null;
}
