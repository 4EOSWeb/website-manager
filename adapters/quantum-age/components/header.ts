/** Shared header. Unlock stays with an administrator. The overlay file is not imported here. */

export const quantumAgeHeaderLock = {
  defaultLocked: true,
  unlockRoles: ["administrator"] as const,
};

export const quantumAgeHeader = {
  id: "quantum-age.header",
  name: "Header",
  category: "custom",
  thumbnail: "none",
  defaultProps: {
    logo: "",
    siteName: "",
    buttonLabel: "",
    buttonHref: "",
    sticky: true,
  },
  propsSchemaId: "quantum-age.header",
  inspector: "header",
  acceptsChildren: false,
  allowedParents: ["page"],
  capabilities: { draggable: false },
  locking: { locked: true },
  renderer: { exportName: "SiteHeader" },
};
