import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";
import { assertStyleCapability } from "./capabilities";
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
      const styles = assertStyleCapability(definition);
      if (!styles.ok) return styles;
      if (items.has(definition.id)) return err(adapterInvalid("That component id is already registered.", "components"));
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
