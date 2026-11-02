import { classifyPointerMove } from "./threshold";

/** A handle can start a drag after the threshold. Text cannot. */
export function handleGesture(input: { onHandle: boolean; onText: boolean; startX: number; startY: number; x: number; y: number }): "drag" | "none" {
  if (input.onText || !input.onHandle) return "none";
  return classifyPointerMove(input.startX, input.startY, input.x, input.y) === "drag" ? "drag" : "none";
}
