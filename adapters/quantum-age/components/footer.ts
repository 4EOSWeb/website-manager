/** Shared footer. Locked the same way as the header. The overlay file is not imported here. */

export const quantumAgeFooterLock = {
  defaultLocked: true,
  unlockRoles: ["administrator"] as const,
};

export const quantumAgeFooter = {
  id: "quantum-age.footer",
  name: "Footer",
  category: "custom",
  thumbnail: "none",
  defaultProps: {
    copyright: "",
    note: "",
    links: [] as { href: string; label: string }[],
    contact: [] as string[],
    social: [] as { href: string; label: string }[],
    images: [] as { src: string; alt: string }[],
  },
  propsSchemaId: "quantum-age.footer",
  inspector: "footer",
  acceptsChildren: false,
  allowedParents: ["page"],
  capabilities: { draggable: false },
  locking: { locked: true },
  renderer: { exportName: "SiteFooter" },
};
