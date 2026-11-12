import { moveBlockToSection } from "@/lib/editor-ops";
import type { SiteDraft } from "@/lib/content-schema";
import { reparent } from "@/platform/drag/reparent";

const closedTypes = new Set(["map", "preset", "designed"]);
const flowParents = { allowedParents: ["section", "container", "stack", "grid", "group", "card"] as const };

export type LayerDropDecision =
  | { kind: "reorder" }
  | { kind: "ignore" }
  | { kind: "reject"; reason: "locked" | "parent_rejected" }
  | { kind: "reparent"; fromSection: string; toSection: string; blockId: string; targetId: string; after: boolean };

/** Sibling drops stay a reorder. A different parent is a reparent, or a rejection. */
export function decideLayerDrop(input: {
  pageId: string;
  sourceId: string;
  sourceParentId: string;
  targetId: string;
  targetParentId: string;
  targetSectionType: string;
  targetContainer: boolean;
  after: boolean;
}): LayerDropDecision {
  if (!input.sourceId || !input.targetId || input.sourceId === input.targetId) return { kind: "ignore" };
  if (input.targetParentId === "chrome" || input.sourceParentId === "chrome") return { kind: "reject", reason: "parent_rejected" };
  if (input.sourceParentId === input.targetParentId) return { kind: "reorder" };
  if (input.sourceParentId === input.pageId) return { kind: "reject", reason: "parent_rejected" };
  if (closedTypes.has(input.targetSectionType)) return { kind: "reject", reason: "parent_rejected" };
  if (input.targetContainer) {
    if (input.targetId === input.sourceParentId) return { kind: "ignore" };
    return { kind: "reparent", fromSection: input.sourceParentId, toSection: input.targetId, blockId: input.sourceId, targetId: "", after: true };
  }
  if (!input.targetParentId || input.targetParentId === input.pageId) return { kind: "reject", reason: "parent_rejected" };
  return {
    kind: "reparent",
    fromSection: input.sourceParentId,
    toSection: input.targetParentId,
    blockId: input.sourceId,
    targetId: input.targetId,
    after: input.after,
  };
}

/**
 * Moves a block into another section and the matching visual node in the same step.
 * A rejected drop returns the reason and does not write either document.
 */
export function applyLayerReparent(
  site: SiteDraft,
  route: string,
  document: unknown,
  decision: Extract<LayerDropDecision, { kind: "reparent" }>,
): { site: SiteDraft; visual: unknown | null } | { reason: "locked" | "parent_rejected" } {
  const visual = reparent(document, {
    nodeId: decision.blockId,
    parentId: decision.toSection,
    targetId: decision.targetId,
    after: decision.after,
    draggedLocked: false,
    childType: "text",
    childParents: flowParents,
    parentType: "section",
    parentChildren: { acceptsChildren: true },
  });
  if (visual && visual.ok === false) return { reason: visual.reason };
  const nextSite = moveBlockToSection(site, route, decision.fromSection, decision.toSection, decision.blockId, decision.targetId, decision.after);
  const siteChanged = JSON.stringify(nextSite) !== JSON.stringify(site);
  if (!siteChanged && !(visual && visual.ok)) return { reason: "parent_rejected" };
  return { site: siteChanged ? nextSite : site, visual: visual && visual.ok ? visual.document : null };
}
