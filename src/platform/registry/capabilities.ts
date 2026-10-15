import { styleKeys as documentStyleKeys } from "../document/styles";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";
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

type ParentLayout = {
  mode: string;
};

/**
 * Resize is allowed only for an unlocked component on a canvas parent.
 * Flow parents cannot resize, even when the component is resizable.
 */
export function canResize(
  definition: Pick<ComponentDefinition, "capabilities">,
  node: LockedNode,
  parent: ParentLayout,
): boolean {
  if (node.locked.locked) return false;
  if (definition.capabilities.resizable !== true) return false;
  return parent.mode === "canvas";
}

type StyleableDefinition = Pick<ComponentDefinition, "capabilities" | "styleKeys">;

const allowedStyleKeys = new Set<string>(documentStyleKeys);

/** A key can be set only when the component is styleable and lists that key. */
export function canSetStyle(definition: StyleableDefinition, key: string): boolean {
  if (definition.capabilities.styleable !== true) return false;
  return (definition.styleKeys ?? []).includes(key);
}

/** Styleable components must list at least one key from the document style set. */
export function assertStyleCapability(definition: StyleableDefinition): Result<true> {
  const keys = definition.styleKeys ?? [];
  const unknown = keys.find((key) => !allowedStyleKeys.has(key));
  if (unknown) return err(adapterInvalid(`Style key ${unknown} is not available.`, "components"));
  if (definition.capabilities.styleable === true && keys.length === 0) {
    return err(adapterInvalid("A styleable component needs at least one style key.", "components"));
  }
  return ok(true);
}

/** Breakpoint overrides require a responsive, unlocked component. */
export function canOverrideBreakpoint(definition: Pick<ComponentDefinition, "capabilities">, node: LockedNode): boolean {
  if (node.locked.locked) return false;
  return definition.capabilities.responsive === true;
}
