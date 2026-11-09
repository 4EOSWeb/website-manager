export const capabilityLabels = {
  supportsPageCreation: "Can create pages",
  supportsBlog: "Can edit articles",
  supportsNavigationEditing: "Can edit navigation",
  supportsFreeCanvas: "Can use a free canvas",
  supportsStructuredSections: "Can use structured sections",
  supportsThemeEditing: "Can edit the theme",
  supportsCustomComponents: "Can use site components",
  supportsForms: "Can use forms",
  supportsSharedLayouts: "Can use a shared layout",
  supportsReviewPublishing: "Can send for review",
} as const;

export function capabilityLines(capabilities: Record<string, unknown> | null | undefined) {
  return (Object.keys(capabilityLabels) as (keyof typeof capabilityLabels)[]).map((key) => ({
    label: capabilityLabels[key],
    value: capabilities?.[key] === true ? "Yes" : "No",
  }));
}

const commandLabels = {
  install: "Install",
  dev: "Development",
  build: "Build",
  preview: "Preview",
} as const;

export function commandLines(commands: Record<string, unknown> | null | undefined) {
  return (Object.keys(commandLabels) as (keyof typeof commandLabels)[]).map((key) => ({
    label: commandLabels[key],
    value: typeof commands?.[key] === "string" ? commands[key] : "Not set",
  }));
}

export function levelLine(level: unknown) {
  return typeof level === "number" ? `Level ${level}` : "Level is not set";
}
