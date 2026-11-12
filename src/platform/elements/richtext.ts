import { sanitizeMarks, type RichMark } from "../../lib/rich-text";
import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** A new rich text node. Marks start empty and use the existing mark shape. */
export function createRichText() {
  return createElement("richtext", "generic.richtext", { text: "Rich text", marks: [] });
}

/** Stores marks on this node with the same helper the editor already uses for text. */
export function applyRichMarks(node: NodeDocument, text: string, marks: RichMark[]): NodeDocument {
  return { ...node, props: { ...node.props, text, marks: sanitizeMarks(text, marks) } };
}

type RichTree = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: RichTree[];
};

function replaceMarks(node: RichTree, nodeId: string, text: string, marks: RichMark[]): boolean {
  if (node.id === nodeId && node.type === "richtext") {
    node.props = { ...(node.props ?? {}), text, marks: sanitizeMarks(text, marks) };
    return true;
  }
  return (node.children ?? []).some((child) => replaceMarks(child, nodeId, text, marks));
}

/** Writes marks onto one rich text node and leaves every other node as it was. */
export function writeRichMarks(document: unknown, nodeId: string, text: string, marks: RichMark[]): unknown | null {
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document) as { pages?: Array<{ root?: RichTree }> };
  const found = (copy.pages ?? []).some((page) => page.root && replaceMarks(page.root, nodeId, text, marks));
  return found ? copy : null;
}
