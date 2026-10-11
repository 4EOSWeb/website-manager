/**
 * Summary block for the article index.
 * The library id `section:insights-summary` stays until step 14.1.
 * Registered custom items leave the library in step 9.27.
 */

export const quantumAgeInsightsSummary = {
  id: "quantum-age.insights-summary",
  name: "Insights summary",
  category: "content",
  thumbnail: "none",
  defaultProps: {
    heading: "",
    intro: "",
  },
  propsSchemaId: "quantum-age.insights-summary",
  inspector: "insights-summary",
  acceptsChildren: false,
  allowedParents: ["section"],
  capabilities: {},
  locking: { locked: false },
  renderer: { exportName: "PageCanvas" },
};
