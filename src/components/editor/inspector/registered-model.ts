import type { ZodType } from "zod";
import { inspectorFields, type InspectorField } from "@/platform/registry/inspector-fields";

export type RegisteredInspector = {
  componentId: string;
  customInspectorId?: string;
  fields: InspectorField[];
};

type RegisteredDefinition = {
  id: string;
  customInspectorId?: string;
  defaultProps?: Record<string, unknown>;
};

/** Field descriptors for registered components. Schemas stay on the server side of this call. */
export function fieldsForRegistered(definitions: readonly RegisteredDefinition[], schemas: Record<string, ZodType>): RegisteredInspector[] {
  return definitions.flatMap((definition) => {
    const schema = schemas[definition.id];
    if (!schema) return [];
    const generated = inspectorFields(schema, definition);
    return [{
      componentId: definition.id,
      ...(definition.customInspectorId ? { customInspectorId: definition.customInspectorId } : {}),
      fields: generated.fields.filter((field) => field.control !== "skipped"),
    }];
  });
}

/** A known slot is data. An unknown id warns an administrator and stays quiet otherwise. */
export function inspectorSlot(id: string | undefined, slots: Record<string, { label: string }>, experience: string): { status: "none" | "ready" | "missing" | "hidden"; label?: string; warning?: string } {
  if (!id) return { status: "none" };
  const slot = slots[id];
  if (slot) return { status: "ready", label: slot.label };
  if (experience === "administrator") return { status: "missing", warning: "This custom inspector is not available." };
  return { status: "hidden" };
}
