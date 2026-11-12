export function cancelDrag(input: { dragging: boolean; dialogOpen: boolean; key: string }): { cancel: boolean; clearStatus: boolean } {
  const cancel = input.dragging && !input.dialogOpen && input.key === "Escape";
  return { cancel, clearStatus: cancel };
}

/** Pointer up after Escape must not apply the drop. A normal release still does. */
export function releaseAfterCancel(canceled: boolean): { applyDrop: boolean } {
  return { applyDrop: !canceled };
}
