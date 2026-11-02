import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** An empty picture grid. Pictures are added to this node only. */
export function createGallery(): NodeDocument {
  return createElement("gallery", "generic.gallery", { images: [], layout: "grid" });
}

type GalleryTree = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: GalleryTree[];
};

function appendImage(node: GalleryTree, nodeId: string, src: string, alt: string): boolean {
  if (node.id === nodeId && node.type === "gallery") {
    const current = Array.isArray(node.props?.images) ? node.props.images : [];
    node.props = { ...(node.props ?? {}), images: [...current, { src, alt }] };
    return true;
  }
  return (node.children ?? []).some((child) => appendImage(child, nodeId, src, alt));
}

/** Appends one picture to a gallery and leaves every other node as it was. */
export function writeGallery(document: unknown, nodeId: string, src: string, alt: string): unknown | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document) as { pages?: Array<{ root?: GalleryTree }> };
  const found = (copy.pages ?? []).some((page) => page.root && appendImage(page.root, nodeId, src, alt));
  return found ? copy : null;
}
