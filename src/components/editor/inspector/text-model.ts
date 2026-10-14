const tags = new Set(["eyebrow", "h1", "h2", "h3", "p"]);
const weights = new Set(["regular", "medium", "bold"]);
const leading = new Set(["tight", "normal", "loose"]);
const tracking = new Set(["tight", "normal", "wide"]);
const align = new Set(["start", "center", "end"]);

/** One text-style key. Anything else, including markup, is ignored. */
export function textStylePatch(key: string, value: string): Record<string, string> | null {
  if (key === "tag" && tags.has(value)) return { tag: value };
  if (key === "weight" && weights.has(value)) return { weight: value };
  if (key === "leading" && leading.has(value)) return { leading: value };
  if (key === "tracking" && tracking.has(value)) return { tracking: value };
  if (key === "align" && align.has(value)) return { align: value };
  if (key === "color" && /^#[0-9a-fA-F]{6}$/.test(value)) return { color: value };
  return null;
}
