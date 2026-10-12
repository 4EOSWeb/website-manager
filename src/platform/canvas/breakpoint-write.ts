export type BreakpointBox = { x: number; y: number; w: number; h: number; aspect?: number; anchor?: string };

export type BreakpointNode = {
  box?: BreakpointBox;
  responsive?: {
    strategy?: "reflow" | "scale" | "custom";
    tablet?: { box?: BreakpointBox };
    mobile?: { box?: BreakpointBox };
  };
};

/** A desktop move writes the base box. It does not create tablet or mobile keys. */
export function writeDesktopBox<T extends BreakpointNode>(node: T, box: BreakpointBox): T {
  return { ...node, box: { ...box } };
}
