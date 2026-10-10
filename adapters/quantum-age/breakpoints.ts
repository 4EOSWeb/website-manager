/** Viewport widths copied from the editor config. Labels name the sizes. The editor radios stay unchanged. */

export const quantumAgeBreakpoints = {
  breakpoints: [
    { id: "desktop" as const, width: 1280, label: "Desktop" },
    { id: "tablet" as const, width: 768, label: "Tablet" },
    { id: "mobile" as const, width: 390, label: "Mobile" },
  ],
};
