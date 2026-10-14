import quantumAgeAdapter from "../../adapters/quantum-age/adapter";
import { quantumAgeInspectorSlots, quantumAgePropsSchemas } from "../../adapters/quantum-age/inspector-schemas";
import { fieldsForRegistered, type RegisteredInspector } from "@/components/editor/inspector/registered-model";
import { loadEditorAdapter } from "@/platform/editor-adapter";

/** Bundled copy for the Next server, which cannot dynamically import an adapter module. */
const bundled = [quantumAgeAdapter];

export function editorAdapterForSite(websiteId: string) {
  return loadEditorAdapter(websiteId, { bundled });
}

/** Plain field descriptors for registered components. The client never imports a site component. */
export function registeredInspectorPlan(fields: Record<string, unknown> | null): { registered: RegisteredInspector[]; slots: Record<string, { label: string }> } {
  const components = (fields?.components as { components?: { id: string; customInspectorId?: string }[] } | undefined)?.components ?? [];
  return { registered: fieldsForRegistered(components, quantumAgePropsSchemas), slots: quantumAgeInspectorSlots };
}
