import { validLink } from "../../lib/links";
import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

/** A new text link. An address that fails the link rules is not created. */
export function createLink(href = "/"): NodeDocument | null {
  const destination = href.trim();
  if (!validLink(destination)) return null;
  return createElement("link", "generic.link", { label: "Link", href: destination });
}

type LinkTree = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: LinkTree[];
};

function replaceHref(node: LinkTree, nodeId: string, href: string): boolean {
  if (node.id === nodeId && node.type === "link") {
    node.props = { ...(node.props ?? {}), href };
    return true;
  }
  return (node.children ?? []).some((child) => replaceHref(child, nodeId, href));
}

/** Writes a valid address onto one link and leaves every other node as it was. */
export function writeLinkHref(document: unknown, nodeId: string, href: string): unknown | null {
  const destination = href.trim();
  if (!validLink(destination)) return null;
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document) as { pages?: Array<{ root?: LinkTree }> };
  const found = (copy.pages ?? []).some((page) => page.root && replaceHref(page.root, nodeId, destination));
  return found ? copy : null;
}
