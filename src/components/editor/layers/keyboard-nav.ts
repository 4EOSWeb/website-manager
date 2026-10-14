export type LayerKeyRow = {
  id: string;
  parentId: string | null;
  expanded: boolean | null;
};

export type LayerKeyAction =
  | { type: "select"; id: string }
  | { type: "expand"; id: string }
  | { type: "collapse"; id: string }
  | { type: "ignore" };

/** Up and Down move the active row. Right expands. Left collapses. Enter selects. A rename field keeps its own keys. */
export function layerKeyAction(rows: readonly LayerKeyRow[], activeId: string, key: string, renameFocused = false): LayerKeyAction {
  if (renameFocused) return { type: "ignore" };
  const index = rows.findIndex((row) => row.id === activeId);
  if (key === "ArrowDown") {
    const next = index >= 0 ? rows[index + 1] : rows[0];
    return next ? { type: "select", id: next.id } : { type: "ignore" };
  }
  if (key === "ArrowUp") {
    if (index <= 0) return { type: "ignore" };
    const previous = rows[index - 1];
    return previous ? { type: "select", id: previous.id } : { type: "ignore" };
  }
  const current = index >= 0 ? rows[index] : undefined;
  if (!current) return { type: "ignore" };
  if (key === "ArrowRight") {
    if (current.expanded === false) return { type: "expand", id: current.id };
    const child = rows[index + 1];
    if (current.expanded === true && child?.parentId === current.id) return { type: "select", id: child.id };
    return { type: "ignore" };
  }
  if (key === "ArrowLeft") {
    if (current.expanded === true) return { type: "collapse", id: current.id };
    if (current.parentId) return { type: "select", id: current.parentId };
    return { type: "ignore" };
  }
  if (key === "Enter") return { type: "select", id: current.id };
  return { type: "ignore" };
}
