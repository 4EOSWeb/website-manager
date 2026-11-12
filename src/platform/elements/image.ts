import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** A new image. It starts empty so it does not copy another picture. */
export function createImage(): NodeDocument {
  return createElement("image", "generic.image", { src: "", alt: "" });
}

type ImageTree = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: ImageTree[];
};

function replaceImage(node: ImageTree, nodeId: string, src: string, alt: string): boolean {
  if (node.id === nodeId && node.type === "image") {
    node.props = { ...(node.props ?? {}), src, alt };
    return true;
  }
  return (node.children ?? []).some((child) => replaceImage(child, nodeId, src, alt));
}

/** Sets the picture on one image node and leaves every other node as it was. */
export function writeImage(document: unknown, nodeId: string, src: string, alt: string): unknown | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document) as { pages?: Array<{ root?: ImageTree }> };
  const found = (copy.pages ?? []).some((page) => page.root && replaceImage(page.root, nodeId, src, alt));
  return found ? copy : null;
}
