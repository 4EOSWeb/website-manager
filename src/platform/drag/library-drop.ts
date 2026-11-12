import { dropCompatibility } from "./compatibility";
import { createButton } from "../elements/button";
import { createImage } from "../elements/image";
import { createInput } from "../elements/input";
import type { NodeDocument } from "../document/node";

type TreeNode = {
  id?: unknown;
  children?: unknown;
  metadata?: { legacyId?: unknown };
};

type Factory = {
  childType: string;
  allowedParents: readonly string[];
  create: () => NodeDocument;
};

const factories: Record<string, Factory> = {
  "element:button": {
    childType: "button",
    allowedParents: ["section", "container", "stack", "grid", "group", "card"],
    create: createButton,
  },
  "element:image": {
    childType: "image",
    allowedParents: ["section", "container", "stack", "grid", "group", "card"],
    create: createImage,
  },
  "element:input": {
    childType: "input",
    allowedParents: ["form", "container"],
    create: createInput,
  },
};

export type LibraryDropInput = {
  factoryId: string;
  parentId: string;
  parentType: string;
  parentLocked: boolean;
  box?: { x: number; y: number; w: number; h: number };
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function matches(node: TreeNode, id: string): boolean {
  if (node.id === id) return true;
  const legacy = node.metadata?.legacyId;
  return legacy === id || (typeof legacy === "string" && legacy.endsWith(`/${id}`));
}

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (matches(node, id)) return node;
  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    if (!child || typeof child !== "object") continue;
    const found = findNode(child as TreeNode, id);
    if (found) return found;
  }
  return null;
}

function locate(document: unknown, id: string): TreeNode | null {
  if (!document || typeof document !== "object") return null;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const root = (page as { root?: TreeNode }).root;
    if (!root) continue;
    const found = findNode(root, id);
    if (found) return found;
  }
  return null;
}

/**
 * Creates one catalog node on a compatible parent.
 * An invalid or locked parent creates nothing.
 */
export function libraryDrop(
  document: unknown,
  input: LibraryDropInput,
): { ok: true; document: unknown; node: NodeDocument } | { ok: false; reason: "locked" | "parent_rejected" } {
  const factory = factories[input.factoryId];
  if (!factory) return { ok: false, reason: "parent_rejected" };
  const reason = dropCompatibility({
    draggedLocked: input.parentLocked,
    childType: factory.childType,
    childParents: { allowedParents: factory.allowedParents },
    parentType: input.parentType,
    parentChildren: { acceptsChildren: true },
  });
  if (reason !== "ok") return { ok: false, reason };
  const node = factory.create();
  if (input.box) {
    node.box = {
      x: clampPercent(input.box.x),
      y: clampPercent(input.box.y),
      w: clampPercent(input.box.w),
      h: clampPercent(input.box.h),
    };
  }
  if (!document || typeof document !== "object") return { ok: true, document: null, node };
  const copy = structuredClone(document);
  const parent = locate(copy, input.parentId);
  if (!parent) return { ok: true, document: null, node };
  const children = Array.isArray(parent.children) ? parent.children : [];
  parent.children = [...children, node];
  return { ok: true, document: copy, node };
}
