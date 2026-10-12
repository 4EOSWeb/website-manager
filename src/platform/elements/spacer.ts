import { createElement } from "./create";

const sizes = new Set(["s", "m", "l"]);

/** A new spacer. The size is small, medium, or large, and it has no text. */
export function createSpacer(size = "m") {
  return createElement("spacer", "generic.spacer", { size: sizes.has(size) ? size : "m" });
}
