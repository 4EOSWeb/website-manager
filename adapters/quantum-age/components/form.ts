/**
 * Contact form fields. `recipient` is a prop on this component.
 * `supportsForms` is set on the full adapter in step 6.25.
 * The overlay contact page is not imported.
 */

export const quantumAgeForm = {
  id: "quantum-age.form",
  name: "Form",
  category: "forms",
  thumbnail: "none",
  defaultProps: {
    nameLabel: "",
    emailLabel: "",
    messageLabel: "",
    buttonLabel: "",
    thankYou: "",
    recipient: "",
  },
  propsSchemaId: "quantum-age.form",
  inspector: "form",
  acceptsChildren: false,
  allowedParents: ["section"],
  capabilities: {},
  locking: { locked: false },
  renderer: { exportName: "SectionView" },
};
