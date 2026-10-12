import { toggleCanvasSelection } from "@/platform/canvas/multi-select";

export type NodeSelection = { nodeIds: string[] };

type LegacySelection = { sectionId: string; itemId: string; itemIds: string[] };

/** The visual editor keeps the older selection object. This list is the node ids beside it. */
export function nodeIdsFromLegacy(legacy: LegacySelection): NodeSelection {
  if (legacy.itemIds.length) return { nodeIds: [...legacy.itemIds] };
  if (legacy.itemId) return { nodeIds: [legacy.itemId] };
  if (legacy.sectionId) return { nodeIds: [legacy.sectionId] };
  return { nodeIds: [] };
}

export function selectNodeId(id: string): NodeSelection {
  return { nodeIds: id ? [id] : [] };
}

export function clearNodeSelection(): NodeSelection {
  return { nodeIds: [] };
}

/** Shift-click toggles. A plain click replaces the selection with one node. */
export function clickNode(current: NodeSelection, id: string, shift: boolean): NodeSelection {
  return { nodeIds: toggleCanvasSelection(current.nodeIds, id, shift) };
}
