export type GeneratedNode = {
  id: string;
  componentId: string;
  metadata: Record<string, unknown>;
  props: Record<string, unknown>;
  styles?: Record<string, string>;
};

export type DesignDefinition = {
  styleKeys?: readonly string[];
  capabilities?: { styleable?: boolean };
  locking?: { locked?: boolean };
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

/** A locked or non-styleable component has no design keys. */
export function visibleDesignKeys(definition: DesignDefinition): string[] {
  if (definition.locking?.locked) return [];
  if (definition.capabilities?.styleable !== true) return [];
  return [...(definition.styleKeys ?? [])];
}

export function designDefinitionFor(componentId: string): DesignDefinition | null {
  if (componentId === "generic.button") {
    return { styleKeys: ["color", "background"], capabilities: { styleable: true }, locking: { locked: false } };
  }
  return null;
}

/** Color token ids from the active adapter. Names are not chosen here. */
export function adapterColorTokens(adapter: unknown): { id: string; value: string }[] {
  if (!adapter || typeof adapter !== "object") return [];
  const tokens = (adapter as { theme?: { tokens?: unknown } }).theme?.tokens;
  if (!Array.isArray(tokens)) return [];
  return tokens.flatMap((token) => {
    if (!token || typeof token !== "object") return [];
    const item = token as { id?: unknown; kind?: unknown; value?: unknown };
    if (typeof item.id !== "string" || typeof item.value !== "string") return [];
    if (item.kind && item.kind !== "color") return [];
    return [{ id: item.id, value: item.value }];
  });
}

export function colorTokenOptions(tokens: readonly { id: string }[]): string[] {
  return tokens.map((token) => token.id);
}

/** Writes one style key. A token reference stays on the node. */
export function writeGeneratedStyle(node: GeneratedNode, key: string, value: string): GeneratedNode {
  return { ...node, styles: { ...node.styles, [key]: value } };
}
