import { ok, type Result } from "../result";
import type { ComponentDefinition } from "./types";

export type ComponentRegistry = {
  register: (definition: ComponentDefinition) => Result<ComponentDefinition>;
  get: (id: string) => ComponentDefinition | undefined;
  list: () => ComponentDefinition[];
};

/** Each site gets its own registry. There is no shared mutable list. */
export function createRegistry(): ComponentRegistry {
  const items = new Map<string, ComponentDefinition>();
  return {
    register(definition) {
      items.set(definition.id, definition);
      return ok(definition);
    },
    get(id) {
      return items.get(id);
    },
    list() {
      return [...items.values()];
    },
  };
}
