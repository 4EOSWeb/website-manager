import { applyDefaults } from "../registry/defaults";
import { registryFromAdapter } from "../registry/discover";
import type { ComponentDefinition } from "../registry/types";
import { createElement } from "./create";

/** Built-in element groups. Site groups and `custom` stay in the Custom catalog. */
const genericCategories = new Set(["text", "actions", "media", "layout", "forms"]);

export type CustomDefinition = {
  id: string;
  name: string;
  category: string;
  defaultProps: Record<string, unknown>;
};

function adapterRecord(adapter: unknown) {
  if (!adapter || typeof adapter !== "object") return null;
  const record = adapter as {
    capabilities?: { supportsCustomComponents?: unknown };
    components?: { components?: unknown };
  };
  return record;
}

/** Registered components for the Custom group. Hidden when the site cannot use them. */
export function customCatalog(adapter: unknown): CustomDefinition[] {
  const record = adapterRecord(adapter);
  if (!record || record.capabilities?.supportsCustomComponents !== true) return [];
  const components = record.components?.components;
  if (!Array.isArray(components)) return [];
  const loaded = registryFromAdapter({ components: { components: components as ComponentDefinition[] } });
  if (!loaded.ok) return [];
  return loaded.value
    .list()
    .filter((item) => item.category === "custom" || !genericCategories.has(item.category))
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      defaultProps: { ...item.defaultProps },
    }));
}

/** A new custom node. Props come from the definition, not from another node. */
export function createCustom(definition: Pick<CustomDefinition, "id" | "defaultProps">) {
  return createElement("custom", definition.id, applyDefaults(definition, {}));
}
