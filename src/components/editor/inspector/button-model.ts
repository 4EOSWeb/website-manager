export type ButtonStateName = "hover" | "focus" | "disabled";

/** Family names from the active adapter. An empty list stays empty. */
export function adapterFontFamilies(fonts: unknown): string[] {
  if (!fonts || typeof fonts !== "object") return [];
  const list = (fonts as { fonts?: unknown }).fonts;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const family = (item as { family?: unknown }).family;
    return typeof family === "string" && family.trim() ? [family] : [];
  });
}

/** Writes one key on a state object. The button stays a single node. */
export function writeButtonState(props: Record<string, unknown>, state: ButtonStateName, key: string, value: string): Record<string, unknown> {
  const current = props[state];
  const previous = current && typeof current === "object" && !Array.isArray(current) ? (current as Record<string, unknown>) : {};
  return { ...props, [state]: { ...previous, [key]: value } };
}

export function buttonStateRecord(props: Record<string, unknown>, state: ButtonStateName): Record<string, string> {
  const current = props[state];
  if (!current || typeof current !== "object" || Array.isArray(current)) return {};
  return Object.fromEntries(Object.entries(current).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

/** Fields the version 3 button preview already understands. */
export function buttonFlowPatch(key: string, value: string): Record<string, unknown> | null {
  if (key === "variant" && (value === "filled" || value === "outline" || value === "text")) return { variant: value };
  if (key === "size" && (value === "s" || value === "m" || value === "l")) return { size: value };
  if (key === "align" && (value === "start" || value === "center" || value === "end")) return { align: value };
  if (key === "icon" && (value === "arrow" || value === "none" || value === "external" || value === "mail" || value === "phone")) return { icon: value };
  if (key === "target" && (value === "same" || value === "new")) return { target: value };
  if ((key === "background" || key === "color") && /^#[0-9a-fA-F]{6}$/.test(value)) return key === "color" ? { textStyle: { color: value } } : { background: value };
  return null;
}
