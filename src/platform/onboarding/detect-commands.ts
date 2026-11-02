export type SuggestedCommand = {
  value: string;
  required: boolean;
};

export type SuggestedCommands = {
  dev: SuggestedCommand;
  build: SuggestedCommand;
  preview: SuggestedCommand;
};

function scriptsOf(packageJson: unknown): Record<string, unknown> | undefined {
  if (!packageJson || typeof packageJson !== "object" || !("scripts" in packageJson)) return undefined;
  const scripts = (packageJson as { scripts?: unknown }).scripts;
  if (!scripts || typeof scripts !== "object") return undefined;
  return scripts as Record<string, unknown>;
}

function suggest(scripts: Record<string, unknown> | undefined, name: "dev" | "build" | "preview"): SuggestedCommand {
  const value = scripts?.[name];
  const text = typeof value === "string" ? value.trim() : "";
  return { value: text, required: text.length === 0 };
}

/** Suggests commands from package.json scripts. It does not run them. */
export function detectCommands(packageJson: unknown): SuggestedCommands {
  const scripts = scriptsOf(packageJson);
  return {
    dev: suggest(scripts, "dev"),
    build: suggest(scripts, "build"),
    preview: suggest(scripts, "preview"),
  };
}
