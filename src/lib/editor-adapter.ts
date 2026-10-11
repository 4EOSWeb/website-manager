import quantumAgeAdapter from "../../adapters/quantum-age/adapter";
import { loadEditorAdapter } from "@/platform/editor-adapter";

/** Bundled copy for the Next server, which cannot dynamically import an adapter module. */
const bundled = [quantumAgeAdapter];

export function editorAdapterForSite(websiteId: string) {
  return loadEditorAdapter(websiteId, { bundled });
}
