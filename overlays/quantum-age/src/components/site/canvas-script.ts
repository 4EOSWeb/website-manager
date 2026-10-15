import { canvasRuntimeScript } from "../../platform/canvas/runtime";

/** Starts the synced generic runtime. Selection, drag, and the toolbar live there. */
export function canvasScript(origin: string) {
  return canvasRuntimeScript(origin);
}
