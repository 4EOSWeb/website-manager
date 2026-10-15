import { z } from "zod";

export const styleKeys = [
  "color",
  "background",
  "border",
  "radius",
  "padding",
  "font",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "width",
  "height",
  "opacity",
] as const;

const colorKeys = new Set(["color", "background", "border"]);
const colorValue = z.string().regex(/^(#[0-9a-fA-F]{3,8}|token:[a-z][a-z0-9-]{0,40})$/);

export const stylesSchema = z.partialRecord(z.enum(styleKeys), z.union([z.string(), z.number()])).superRefine((value, ctx) => {
  for (const [key, item] of Object.entries(value)) {
    if (colorKeys.has(key) && (typeof item !== "string" || !colorValue.safeParse(item).success)) {
      ctx.addIssue({ code: "custom", message: "Use a hex color or a token reference.", path: [key] });
    }
  }
});
