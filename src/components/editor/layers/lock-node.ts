import type { SiteDraft } from "@/lib/content-schema";

type LockNode = { id?: unknown; locked?: { locked?: boolean }; children?: unknown };

/** Sets a flow block's lock. The text is copied through unchanged. */
export function lockFlowBlock(site: SiteDraft, route: string, sectionId: string, blockId: string): SiteDraft {
  return {
    ...site,
    pages: site.pages.map((page) => {
      if (page.route !== route) return page;
      return {
        ...page,
        sections: page.sections.map((section) => {
          if (section.id !== sectionId || section.type !== "flow") return section;
          return {
            ...section,
            blocks: section.blocks.map((block) => (block.id === blockId ? { ...block, locked: true } : block)),
          };
        }),
      };
    }),
  };
}

function lockTree<T extends LockNode>(node: T, nodeId: string, found: { ok: boolean }): T {
  if (node.id === nodeId) {
    found.ok = true;
    return { ...node, locked: { locked: true } };
  }
  if (!Array.isArray(node.children)) return node;
  return { ...node, children: node.children.map((child) => (child && typeof child === "object" ? lockTree(child as T, nodeId, found) : child)) };
}

/** Sets `locked` on one visual node, or null when that id is missing. */
export function lockVisualNode(document: unknown, nodeId: string): unknown | null {
  if (!document || typeof document !== "object" || !nodeId) return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  const found = { ok: false };
  const nextPages = pages.map((page) => {
    if (!page || typeof page !== "object" || !(page as { root?: LockNode }).root) return page;
    const current = page as { root: LockNode };
    return { ...current, root: lockTree(current.root, nodeId, found) };
  });
  if (!found.ok) return null;
  return { ...(document as Record<string, unknown>), pages: nextPages };
}
