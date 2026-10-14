import { z } from "zod";

/** Props a generic heading accepts. Other elements add their schemas in later inspector steps. */
export const genericHeadingProps = z.object({
  text: z.string(),
  level: z.number(),
});

export function propsSchemaFor(componentId: string) {
  if (componentId === "generic.heading") return genericHeadingProps;
  return null;
}
