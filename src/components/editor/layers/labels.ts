import { nodeTypes, type NodeType } from "@/platform/document/node-type";

const labels: Record<NodeType | "paragraph" | "canvas", string> = {
  page: "Page",
  section: "Section",
  container: "Container",
  stack: "Stack",
  grid: "Grid",
  group: "Group",
  text: "Text",
  heading: "Heading",
  richtext: "Rich text",
  button: "Button",
  link: "Link",
  image: "Image",
  video: "Video",
  icon: "Icon",
  divider: "Divider",
  spacer: "Spacer",
  gallery: "Gallery",
  card: "Card",
  form: "Form",
  input: "Input",
  textarea: "Text area",
  select: "Select",
  checkbox: "Checkbox",
  testimonial: "Testimonial",
  faq: "FAQ",
  cta: "Call to action",
  embed: "Embed",
  custom: "Custom",
  paragraph: "Paragraph",
  canvas: "Canvas",
};

/** The generic word for a node type. Unknown types stay as their id. */
export function typeLabel(type: string): string {
  return labels[type as NodeType] ?? type;
}

/** A row says its type, unless the page renamed it. Custom rows use the registry's display name. */
export function layerNodeLabel(node: { type: string; metadata?: { name?: unknown } }, registryName?: string | null): string {
  const name = node.metadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  if (node.type === "custom" && registryName && registryName.trim()) return registryName.trim();
  return typeLabel(node.type);
}

export const labeledNodeTypes: readonly string[] = [...nodeTypes, "paragraph", "canvas"];

export type LayerExperience = "basic" | "advanced" | "administrator";

const containerTypes = new Set(["page", "section", "container", "stack", "grid", "group", "canvas"]);

/** Flow, Stack, Grid, or Canvas for a container. Other nodes have no layout label. */
export function layoutModeLabel(node: { type?: string; layout?: { mode?: string; display?: string } | null }): string {
  if (node.type && !containerTypes.has(node.type)) return "";
  const mode = node.layout?.mode;
  const display = node.layout?.display;
  if (mode === "canvas") return "Canvas";
  if (display === "grid") return "Grid";
  if (display === "flex") return "Stack";
  if (mode === "flow") return "Flow";
  if (node.type === "canvas") return "Canvas";
  if (node.type === "grid") return "Grid";
  if (node.type === "stack") return "Stack";
  if (node.type === "section" || node.type === "container" || node.type === "group" || node.type === "page") return "Flow";
  return "";
}

/** Advanced and Administrator can copy the component id. Basic rows omit it. */
export function layerIdText(mode: LayerExperience, node: { id?: string; componentId?: string | null }): string {
  if (mode === "basic") return "";
  const componentId = typeof node.componentId === "string" ? node.componentId.trim() : "";
  if (componentId) return componentId;
  return typeof node.id === "string" ? node.id.trim() : "";
}
