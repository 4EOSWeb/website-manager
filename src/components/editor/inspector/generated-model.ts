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
