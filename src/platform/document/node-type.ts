import { z } from "zod";

export const nodeTypes = [
  "page",
  "section",
  "container",
  "stack",
  "grid",
  "group",
  "text",
  "heading",
  "richtext",
  "button",
  "link",
  "image",
  "video",
  "icon",
  "divider",
  "spacer",
  "gallery",
  "card",
  "form",
  "input",
  "textarea",
  "select",
  "checkbox",
  "testimonial",
  "faq",
  "cta",
  "embed",
  "custom",
] as const;

export const nodeTypeSchema = z.enum(nodeTypes);

export type NodeType = z.infer<typeof nodeTypeSchema>;
