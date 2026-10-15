/** Site card. Defaults stay empty so marketing copy is not stored on the definition. */

export const quantumAgeCard = {
  id: "quantum-age.card",
  name: "Card",
  category: "content",
  thumbnail: "none",
  defaultProps: {
    heading: "",
    body: "",
  },
  propsSchemaId: "quantum-age.card",
  inspector: "card",
  acceptsChildren: false,
  allowedParents: ["section"],
  capabilities: {},
  locking: { locked: false },
  renderer: { exportName: "FlowSection" },
};
