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

/** A tablet move stores a tablet box and marks that node custom. The desktop box and an absent mobile key stay as they were. */
export function writeTabletBox<T extends BreakpointNode>(node: T, box: BreakpointBox): T {
  return {
    ...node,
    responsive: {
      ...node.responsive,
      strategy: "custom",
      tablet: { ...node.responsive?.tablet, box: { ...box } },
    },
  };
}

/** A mobile move stores a mobile box and marks that node custom. Desktop and tablet boxes stay as they were. */
export function writeMobileBox<T extends BreakpointNode>(node: T, box: BreakpointBox): T {
  return {
    ...node,
    responsive: {
      ...node.responsive,
      strategy: "custom",
      mobile: { ...node.responsive?.mobile, box: { ...box } },
    },
  };
}
