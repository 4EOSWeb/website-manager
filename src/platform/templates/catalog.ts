export type TemplateChoice = { id: string; name: string };

/** Generic starters. Site templates are added from the adapter, not listed here. */
export const platformTemplates: readonly TemplateChoice[] = [
  { id: "blank", name: "Blank page" },
  { id: "canvas", name: "Blank canvas" },
  { id: "landing", name: "Landing page" },
  { id: "service", name: "Service page" },
  { id: "article", name: "Article" },
];

function adapterTemplates(adapter: unknown): TemplateChoice[] {
  if (!adapter || typeof adapter !== "object") return [];
  const group = (adapter as { templates?: unknown }).templates;
  const list = group && typeof group === "object" ? (group as { templates?: unknown }).templates : null;
  if (!Array.isArray(list)) return [];
  const choices: TemplateChoice[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const id = (item as { id?: unknown }).id;
    const name = (item as { name?: unknown }).name;
    if (typeof id !== "string" || typeof name !== "string" || !id || !name) continue;
    choices.push({ id, name });
  }
  return choices;
}

/** Platform starters, then any adapter template whose id is not already listed. */
export function templateChoices(adapter: unknown): TemplateChoice[] {
  const chosen = platformTemplates.map((item) => ({ ...item }));
  const seen = new Set(chosen.map((item) => item.id));
  for (const item of adapterTemplates(adapter)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    chosen.push(item);
  }
  return chosen;
}
