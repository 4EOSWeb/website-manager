import { quantumAgeHeroProps } from "./components/hero";
import { quantumAgeInsightsSummaryProps } from "./components/insights";

/** Props schemas for registered components. Passed to the editor as field data. */
export const quantumAgePropsSchemas = {
  "quantum-age.hero": quantumAgeHeroProps,
  "quantum-age.insights-summary": quantumAgeInsightsSummaryProps,
};

/** Slots the server knows how to fill. Unknown ids are not listed. */
export const quantumAgeInspectorSlots: Record<string, { label: string }> = {};
