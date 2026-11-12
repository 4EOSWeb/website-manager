export type BreakpointId = "desktop" | "tablet" | "mobile";

/** Visible radio names. Mobile stays “Phone” so the device switch matches the current editor. */
export const previewRadioLabel: Record<BreakpointId, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Phone",
};

const fallbackWidth: Record<BreakpointId, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

export function breakpointWidths(adapter: Record<string, unknown> | null): Record<BreakpointId, number> {
  const widths = { ...fallbackWidth };
  const group = adapter?.breakpoints;
  if (!group || typeof group !== "object") return widths;
  const list = (group as { breakpoints?: unknown }).breakpoints;
  if (!Array.isArray(list)) return widths;
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const record = item as { id?: unknown; width?: unknown };
    if ((record.id === "desktop" || record.id === "tablet" || record.id === "mobile") && typeof record.width === "number") {
      widths[record.id] = record.width;
    }
  }
  return widths;
}

export function breakpointWidth(adapter: Record<string, unknown> | null, id: BreakpointId): number {
  return breakpointWidths(adapter)[id];
}
