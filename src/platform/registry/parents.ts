import { parentRejected } from "../errors";
import { err, ok, type Result } from "../result";
import type { ComponentDefinition } from "./types";

const containerTypes = ["section", "container", "stack", "grid", "group"];

export function assertParent(definition: Pick<ComponentDefinition, "allowedParents">, parentType: string): Result<true> {
  const allowed = definition.allowedParents.length > 0 ? definition.allowedParents : containerTypes;
  if (!allowed.includes(parentType)) return err(parentRejected());
  return ok(true);
}
