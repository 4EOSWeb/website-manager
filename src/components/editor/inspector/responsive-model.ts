export const strategyNames = ["Scale", "Reflow", "Custom"] as const;

export type StrategyName = (typeof strategyNames)[number];

export type StrategyValue = "scale" | "reflow" | "custom";

/** Canvas items show strategy unless the component turns responsive off. Flow does not. */
export function responsiveFieldsVisible(input: { mode: "flow" | "canvas"; responsive?: boolean }): boolean {
  if (input.responsive === false) return false;
  return input.mode === "canvas";
}

export function strategyLabel(value: string | undefined): StrategyName {
  if (value === "scale") return "Scale";
  if (value === "custom") return "Custom";
  return "Reflow";
}

export function strategyValue(name: string): StrategyValue | null {
  if (name === "Scale") return "scale";
  if (name === "Reflow") return "reflow";
  if (name === "Custom") return "custom";
  return null;
}

/** Writes the strategy onto the node and leaves its other fields in place. */
export function applyStrategy<T extends { strategy?: StrategyValue; responsive?: { strategy?: StrategyValue } }>(
  node: T,
  strategy: StrategyValue,
): T & { strategy: StrategyValue; responsive: { strategy: StrategyValue } } {
  return { ...node, strategy, responsive: { ...node.responsive, strategy } };
}
