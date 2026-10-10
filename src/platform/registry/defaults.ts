import type { ComponentDefinition } from "./types";

export function applyDefaults(definition: Pick<ComponentDefinition, "defaultProps">, props: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...definition.defaultProps };
  for (const [key, value] of Object.entries(props)) next[key] = value;
  return next;
}
