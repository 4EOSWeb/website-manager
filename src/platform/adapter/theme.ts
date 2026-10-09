import { z } from "zod";

const tokenId = z.string().regex(/^[a-z][a-z0-9-]{0,32}$/);
const hexColor = /^#[0-9a-fA-F]{3,8}$/;

const themeTokenSchema = z.object({
  id: tokenId,
  label: z.string().min(1),
  kind: z.enum(["color", "space", "other"]),
  value: z.string().min(1),
}).strict().superRefine((token, ctx) => {
  if (token.kind === "color" && !hexColor.test(token.value)) {
    ctx.addIssue({ code: "custom", message: "Use a hex color.", path: ["value"] });
  }
});

export const themeSchema = z.object({
  tokens: z.array(themeTokenSchema),
}).strict().superRefine((theme, ctx) => {
  const ids = new Set<string>();
  for (const token of theme.tokens) {
    if (ids.has(token.id)) ctx.addIssue({ code: "custom", message: "Each token needs its own id.", path: ["tokens"] });
    ids.add(token.id);
  }
});

export type AdapterTheme = z.infer<typeof themeSchema>;
