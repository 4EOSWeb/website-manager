import type { ZodType } from "zod";

export type InspectorControl = "text" | "radio" | "select" | "switch" | "number" | "skipped";

export type InspectorField = {
  prop: string;
  label: string;
  control: InspectorControl;
  warning?: string;
};

type SchemaNode = {
  type?: string;
  shape?: Record<string, SchemaNode>;
  options?: readonly string[];
};

const radioLimit = 3;

function labelFor(prop: string): string {
  const words = prop.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function controlFor(node: SchemaNode, prop: string): { control: InspectorControl; warning?: string } {
  if (node.type === "string") return { control: "text" };
  if (node.type === "boolean") return { control: "switch" };
  if (node.type === "number") return { control: "number" };
  if (node.type === "enum") {
    const count = node.options?.length ?? 0;
    return { control: count > 0 && count <= radioLimit ? "radio" : "select" };
  }
  const warning = `${labelFor(prop)} uses ${node.type ?? "an unknown type"}, which has no control yet.`;
  return { control: "skipped", warning };
}

/** Turns a props schema into inspector descriptors. This module does not render React. */
export function inspectorFields(schema: ZodType): { fields: InspectorField[]; warnings: string[] } {
  const shape = (schema as SchemaNode).shape;
  if (!shape) {
    const warning = "The props schema is not an object, so no fields were generated.";
    return { fields: [], warnings: [warning] };
  }
  const fields: InspectorField[] = [];
  const warnings: string[] = [];
  for (const [prop, child] of Object.entries(shape)) {
    const mapped = controlFor(child, prop);
    const field: InspectorField = { prop, label: labelFor(prop), control: mapped.control };
    if (mapped.warning) {
      field.warning = mapped.warning;
      warnings.push(mapped.warning);
    }
    fields.push(field);
  }
  return { fields, warnings };
}
