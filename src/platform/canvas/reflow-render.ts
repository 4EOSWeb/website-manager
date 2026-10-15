export type CanvasPercentBox = { x: number; y: number; w: number; h: number };

export type ReflowChild = {
  id: string;
  box?: CanvasPercentBox;
  responsive?: {
    strategy?: "reflow" | "scale" | "custom";
    tablet?: { box?: CanvasPercentBox };
    mobile?: { box?: CanvasPercentBox };
  };
};

export type RenderedChild =
  | { id: string; mode: "stack" }
  | { id: string; mode: "placed"; box: CanvasPercentBox };

function copyBox(box: CanvasPercentBox): CanvasPercentBox {
  return { x: box.x, y: box.y, w: box.w, h: box.h };
}

/**
 * Inherited reflow children stack in document order at full width.
 * Scale keeps the desktop percentages. Custom uses the stored breakpoint box.
 */
export function renderCanvasBreakpoint(children: ReflowChild[], breakpoint: "desktop" | "tablet" | "mobile"): RenderedChild[] {
  return children.map((child) => {
    if (breakpoint === "desktop" && child.box) return { id: child.id, mode: "placed", box: copyBox(child.box) };
    const strategy = child.responsive?.strategy ?? "reflow";
    const override = breakpoint === "desktop" ? undefined : child.responsive?.[breakpoint]?.box;
    if (strategy === "custom" && override) return { id: child.id, mode: "placed", box: copyBox(override) };
    if (strategy === "scale" && child.box) return { id: child.id, mode: "placed", box: copyBox(child.box) };
    return { id: child.id, mode: "stack" };
  });
}
