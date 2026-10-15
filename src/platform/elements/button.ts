import { validLink } from "../../lib/links";
import type { NodeDocument } from "../document/node";
import { createElement } from "./create";

export const buttonDefaults = {
  label: "Button",
  href: "/",
  target: "same",
  variant: "filled",
  size: "m",
  font: "",
  color: "",
  background: "",
  border: "",
  radius: "",
  padding: "",
  icon: "none",
  iconPosition: "end",
  hover: {},
  focus: {},
  disabled: {},
  align: "start",
  width: "auto",
  hideOn: [] as string[],
};

/** A new button. Its label and address belong to this node. */
export function createButton(): NodeDocument {
  return createElement("button", "generic.button", { ...buttonDefaults, hover: {}, focus: {}, disabled: {}, hideOn: [] });
}

type ButtonTree = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: ButtonTree[];
};

function replaceField(node: ButtonTree, nodeId: string, field: "label" | "href", value: string): boolean {
  if (node.id === nodeId && node.type === "button") {
    node.props = { ...(node.props ?? {}), [field]: value };
    return true;
  }
  return (node.children ?? []).some((child) => replaceField(child, nodeId, field, value));
}

/** Writes a label or a valid address onto one button and leaves every other node as it was. */
export function writeButtonField(document: unknown, nodeId: string, field: "label" | "href", value: string): unknown | null {
  if (field === "href" && !validLink(value.trim())) return null;
  if (!document || typeof document !== "object") return null;
  const copy = structuredClone(document) as { pages?: Array<{ root?: ButtonTree }> };
  const found = (copy.pages ?? []).some((page) => page.root && replaceField(page.root, nodeId, field, field === "href" ? value.trim() : value));
  return found ? copy : null;
}
