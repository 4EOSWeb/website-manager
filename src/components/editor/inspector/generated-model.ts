export type GeneratedNode = {
  id: string;
  componentId: string;
  metadata: Record<string, unknown>;
  props: Record<string, unknown>;
};

/** The name lives on metadata. The id and component stay as they were. */
export function renameGeneratedNode(node: GeneratedNode, name: string): GeneratedNode {
  return { ...node, metadata: { ...node.metadata, name } };
}

export function generatedName(node: GeneratedNode): string {
  return typeof node.metadata.name === "string" ? node.metadata.name : "";
}

const contentProps = new Set(["text", "label", "quote", "title"]);

/** Text, label, quote, and title are content. Layout and other props are not. */
export function isContentProp(prop: string, control: string): boolean {
  return control === "text" && contentProps.has(prop);
}

/** Writes one prop and leaves the rest of the node alone. */
export function writeGeneratedProp(node: GeneratedNode, prop: string, value: string): GeneratedNode {
  return { ...node, props: { ...node.props, [prop]: value } };
}
