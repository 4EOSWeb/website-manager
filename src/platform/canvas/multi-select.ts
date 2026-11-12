/** Shift-click toggles a canvas node. A plain click keeps only that node. */
export function toggleCanvasSelection(nodeIds: readonly string[], id: string, shift: boolean): string[] {
  if (!id) return shift ? [...nodeIds] : [];
  if (!shift) return [id];
  if (nodeIds.includes(id)) return nodeIds.filter((entry) => entry !== id);
  return [...nodeIds, id];
}

/** Different prop values in one selection are mixed and stay read-only. */
export function mixedProps(values: readonly unknown[]): boolean {
  if (values.length < 2) return false;
  return values.some((value) => value !== values[0]);
}
