import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";
import type { ComponentRegistry } from "./register";
import type { ComponentDefinition } from "./types";

export const libraryCategories = ["text", "actions", "media", "layout", "content", "forms", "custom"] as const;

export type LibraryCategory = (typeof libraryCategories)[number];

const categorySet = new Set<string>(libraryCategories);

export function assertCategory(definition: Pick<ComponentDefinition, "category">): Result<true> {
  if (!categorySet.has(definition.category)) return err(adapterInvalid("That category is not available.", "components"));
  return ok(true);
}

export function groupByCategory(registry: Pick<ComponentRegistry, "list">): Record<LibraryCategory, ComponentDefinition[]> {
  const groups = Object.fromEntries(libraryCategories.map((id) => [id, [] as ComponentDefinition[]])) as Record<LibraryCategory, ComponentDefinition[]>;
  for (const item of registry.list()) {
    if (categorySet.has(item.category)) groups[item.category as LibraryCategory].push(item);
  }
  return groups;
}
