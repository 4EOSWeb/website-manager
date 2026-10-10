import type { ComponentDefinition } from "./types";

/** A node lock from the visual document. Dragging never starts here. */
type LockedNode = {
  locked: { locked: boolean };
};

/**
 * A locked node cannot be dragged, even when the component is draggable.
 * Missing `draggable` means the component cannot be dragged.
 */
export function canDrag(definition: Pick<ComponentDefinition, "capabilities">, node: LockedNode): boolean {
  if (node.locked.locked) return false;
  return definition.capabilities.draggable === true;
}
