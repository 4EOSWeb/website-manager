import { z } from "zod";

/** Site button props. The generic button node type stays in the platform. */

export const quantumAgeButtonProps = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.enum(["filled", "outline", "text"]),
  size: z.enum(["s", "m", "l"]),
  target: z.enum(["same", "new"]),
  icon: z.enum(["arrow", "none", "external", "mail", "phone"]),
}).strict();

export const quantumAgeButton = {
  id: "quantum-age.button",
  name: "Button",
  category: "actions",
  thumbnail: "none",
  defaultProps: {
    label: "",
    href: "",
    variant: "filled" as const,
    size: "m" as const,
    target: "same" as const,
    icon: "none" as const,
  },
  propsSchemaId: "quantum-age.button",
  inspector: "button",
  acceptsChildren: false,
  allowedParents: ["section"],
  capabilities: {},
  locking: { locked: false },
  renderer: { exportName: "Button" },
};
