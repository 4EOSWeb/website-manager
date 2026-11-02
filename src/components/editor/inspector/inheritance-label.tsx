"use client";

import { inheritanceLabelText, type InheritanceNode } from "@/components/editor/inspector/inheritance-text";
import type { Viewport } from "@/components/editor/types";

export function InheritanceLabel(props: {
  mode: "flow" | "canvas";
  breakpoint: Viewport;
  node: InheritanceNode;
}) {
  const label = inheritanceLabelText(props);
  if (!label) return null;
  return <p className="ed-hint" data-inheritance="true">{label}</p>;
}
