import { inheritedBreakpoints } from "@/platform/document/inheritance";
import type { Viewport } from "@/components/editor/types";

export type InheritanceNode = {
  box?: unknown;
  responsive?: {
    tablet?: { box?: unknown };
    mobile?: { box?: unknown };
  };
};

/** Absent tablet and mobile keys inherit. An explicit box is a custom position. Flow mode has no label. */
export function inheritanceLabelText(input: {
  mode: "flow" | "canvas";
  breakpoint: Viewport;
  node: InheritanceNode;
}): string | null {
  if (input.mode === "flow" || input.breakpoint === "desktop") return null;
  const inherited = inheritedBreakpoints(input.node);
  if (!inherited.includes(input.breakpoint)) return "Custom position";
  if (input.breakpoint === "mobile" && !inherited.includes("tablet")) return "Inherits from tablet";
  return "Inherits from desktop";
}
