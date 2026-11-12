const controlTags = new Set(["input", "textarea", "button", "a"]);

/**
 * A text selection or a control must not start a node drag.
 * The grip can still start one when the selection is collapsed.
 */
export function dragBlocked(input: {
  selectionCollapsed: boolean;
  selectionInsideNode: boolean;
  targetTag: string;
  contentEditable: boolean;
  onGrip: boolean;
}): boolean {
  if (!input.selectionCollapsed && input.selectionInsideNode) return true;
  if (input.onGrip) return false;
  if (controlTags.has(input.targetTag.toLowerCase())) return true;
  if (input.contentEditable) return true;
  return false;
}
