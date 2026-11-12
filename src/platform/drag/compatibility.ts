import { assertChild } from "../registry/children";
import { assertParent } from "../registry/parents";

export type DropReason = "locked" | "parent_rejected" | "ok";

/** Accept or reject a drop using the lock and the registry parent and child rules. */
export function dropCompatibility(input: {
  draggedLocked: boolean;
  childType: string;
  childParents: { allowedParents: readonly string[] };
  parentType: string;
  parentChildren: { acceptsChildren: boolean; allowedChildren?: readonly string[] };
}): DropReason {
  if (input.draggedLocked) return "locked";
  if (!assertParent(input.childParents, input.parentType).ok) return "parent_rejected";
  if (!assertChild(input.parentChildren, input.childType).ok) return "parent_rejected";
  return "ok";
}
