/** Commands copied from the editor config. Preview is the command the hub already spawns. */

export const quantumAgeCommands = {
  packageManager: "npm" as const,
  install: "npm ci",
  dev: "npm run dev",
  build: "npm run build",
  preview: "npm run dev",
};
