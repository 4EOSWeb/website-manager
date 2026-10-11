/**
 * Lock policy for this site. Runtime checks still read the draft flags.
 * Do not change those checks in this step.
 */

export { quantumAgeHeaderLock } from "./components/header";
export { quantumAgeFooterLock } from "./components/footer";
export { quantumAgeLogoLock } from "./components/logo";

/** Files and components the editor cannot unlock. Copied from the editor config. */
export const externalLockedFiles = [
  "Rings",
  "FormulaStory",
  "globals.css",
  "next.config.ts",
  "start-site.ps1",
] as const;
