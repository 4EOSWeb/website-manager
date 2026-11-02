/** Locked logo image. The platform image node stays generic and unlocked by default. */

export const quantumAgeLogoLock = {
  defaultLocked: true,
  unlockRoles: ["administrator"] as const,
};

export const quantumAgeLogo = {
  id: "quantum-age.logo",
  name: "Logo",
  category: "media",
  thumbnail: "none",
  defaultProps: {
    src: "",
    alt: "",
  },
  propsSchemaId: "quantum-age.logo",
  inspector: "logo",
  acceptsChildren: false,
  allowedParents: ["section"],
  capabilities: { draggable: false },
  locking: { locked: true },
  renderer: { exportName: "Logo" },
};
