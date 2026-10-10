import { ok, type Result } from "../result";
import { createRegistry, type ComponentRegistry } from "./register";
import type { ComponentDefinition } from "./types";

type AdapterComponents = {
  components: {
    components: readonly ComponentDefinition[];
  };
};

export function registryFromAdapter(adapter: AdapterComponents): Result<ComponentRegistry> {
  const registry = createRegistry();
  for (const definition of adapter.components.components) {
    const registered = registry.register(definition);
    if (!registered.ok) return registered;
  }
  return ok(registry);
}
