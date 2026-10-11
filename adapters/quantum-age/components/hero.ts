import { z } from "zod";

/**
 * Home hero props. Names here match the fields `heroFields` already writes.
 * The hero frame is editable today, so the lock default stays open.
 * Text fields stay editable. The overlay renderer is not imported.
 */

const imagePath = z.string().regex(/^$|^\/media\/[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|svg)$/i);

export const quantumAgeHeroProps = z.object({
  tagline: z.string(),
  positioning: z.string(),
  primaryButton: z.object({
    label: z.string(),
    href: z.string(),
  }).strict(),
  heroImage: z.object({
    src: imagePath,
    alt: z.string(),
    placement: z.enum(["with-copy", "beside-mark"]),
    align: z.enum(["start", "end"]),
    width: z.enum(["narrow", "medium", "wide"]),
    aspect: z.enum(["auto", "square", "landscape"]),
    focal: z.enum(["center", "top", "bottom", "left", "right"]),
  }).strict(),
}).strict();

export const quantumAgeHeroLock = {
  defaultLocked: false,
  unlockRoles: ["administrator"] as const,
};

const emptyHero = {
  tagline: "",
  positioning: "",
  primaryButton: { label: "", href: "" },
  heroImage: {
    src: "",
    alt: "",
    placement: "with-copy" as const,
    align: "start" as const,
    width: "medium" as const,
    aspect: "auto" as const,
    focal: "center" as const,
  },
};

export const quantumAgeHero = {
  id: "quantum-age.hero",
  name: "Hero",
  category: "custom",
  thumbnail: "none",
  defaultProps: emptyHero,
  propsSchemaId: "quantum-age.hero",
  inspector: "hero",
  acceptsChildren: false,
  allowedParents: ["page"],
  capabilities: {},
  locking: { locked: false },
  renderer: { exportName: "FlowSection" },
};
