import { parentRejected } from "../errors";
import { err, ok, type Result } from "../result";
import type { ComponentDefinition } from "./types";

export function assertChild(
  parent: Pick<ComponentDefinition, "acceptsChildren" | "allowedChildren">,
  childType: string,
): Result<true> {
  if (!parent.acceptsChildren) return err(parentRejected());
  if (parent.allowedChildren && !parent.allowedChildren.includes(childType)) return err(parentRejected());
  return ok(true);
}
