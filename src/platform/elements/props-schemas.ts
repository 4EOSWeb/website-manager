import { z } from "zod";

/** Props a generic heading accepts. Other elements add their schemas as their inspector steps land. */
export const genericHeadingProps = z.object({
  text: z.string(),
  level: z.number(),
});

export const genericTextProps = z.object({
  text: z.string(),
});

export function propsSchemaFor(componentId: string) {
  if (componentId === "generic.heading") return genericHeadingProps;
  if (componentId === "generic.text") return genericTextProps;
  return null;
}
