type BreakpointOverride = { box?: unknown };

export function inheritedBreakpoints(node: { responsive?: { tablet?: BreakpointOverride; mobile?: BreakpointOverride } }): Array<"tablet" | "mobile"> {
  const names = ["tablet", "mobile"] as const;
  return names.filter((name) => node.responsive?.[name]?.box === undefined);
}
