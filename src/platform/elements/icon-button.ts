import { buttonDefaults } from "./button";
import { createElement } from "./create";

/** A button that shows an icon. The label is its accessible name. */
export function createIconButton() {
  return createElement("button", "generic.icon-button", {
    ...buttonDefaults,
    label: "Icon button",
    icon: "arrow",
    variant: "icon",
    hover: {},
    focus: {},
    disabled: {},
    hideOn: [],
  });
}
