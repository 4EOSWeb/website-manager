import { z } from "zod";

export const harborTideClockProps = z.object({
  label: z.string(),
}).strict();

export const harborTideClock = {
  id: "harbor.tide-clock",
  name: "Tide clock",
  category: "custom",
  thumbnail: "none",
  defaultProps: { label: "Tide clock" },
  propsSchemaId: "harbor.tide-clock",
  inspector: "tide-clock",
  acceptsChildren: false,
  allowedParents: ["section", "canvas"],
  capabilities: {},
  locking: { locked: false },
  renderer: { exportName: "TideClock" },
};

export const harborButton = {
  id: "harbor.button",
  name: "Button",
  category: "actions",
  thumbnail: "none",
  defaultProps: { label: "Plan a visit", href: "/visit" },
  propsSchemaId: "harbor.button",
  inspector: "button",
  acceptsChildren: false,
  allowedParents: ["section", "canvas"],
  capabilities: {},
  locking: { locked: false },
  renderer: { exportName: "HarborPillButton" },
};

export const harborRegistry = [harborTideClock, harborButton];
