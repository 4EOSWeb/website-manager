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
