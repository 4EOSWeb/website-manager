export type CanvasPercentages = { x: number; y: number; w: number; h: number };

export type ResponsiveStrategy = "scale" | "reflow" | "custom";

export type FlowPlacement = { mode: "flow"; direction: "vertical" };

type BreakpointName = "tablet" | "mobile";

type CanvasChild = {
  box?: CanvasPercentages;
  responsive?: {
    strategy?: ResponsiveStrategy;
    tablet?: { box?: CanvasPercentages };
    mobile?: { box?: CanvasPercentages };
  };
};

/** Reflow is the default for new canvas nodes. */
export const defaultCanvasStrategy: ResponsiveStrategy = "reflow";

/** Scale keeps parent percentages. It does not convert them to viewport pixels. */
export function resolveScale(box: CanvasPercentages): CanvasPercentages {
  return { x: box.x, y: box.y, w: box.w, h: box.h };
}

export function resolveReflow(): FlowPlacement {
  return { mode: "flow", direction: "vertical" };
}

export type BreakpointPlacement = FlowPlacement | { box: CanvasPercentages };

function copyBox(box: CanvasPercentages): CanvasPercentages {
  return { x: box.x, y: box.y, w: box.w, h: box.h };
}

/** Custom uses a breakpoint box when one is stored. A missing custom breakpoint reflows. */
export function resolveBreakpoint(child: CanvasChild, breakpoint: BreakpointName): BreakpointPlacement {
  const strategy = child.responsive?.strategy ?? defaultCanvasStrategy;
  const box = child.responsive?.[breakpoint]?.box;
  if (strategy === "custom") return box ? { box: copyBox(box) } : resolveReflow();
  if (strategy === "scale" && child.box) return { box: resolveScale(child.box) };
  return resolveReflow();
}

/** A missing smaller breakpoint reflows. It does not copy the desktop box. */
export function resolveMissingBreakpoint(child: CanvasChild, breakpoint: BreakpointName): BreakpointPlacement {
  return resolveBreakpoint(child, breakpoint);
}
