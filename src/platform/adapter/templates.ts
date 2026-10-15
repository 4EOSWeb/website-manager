import { z } from "zod";
import { validateDocument } from "../document/document";

export const templateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  document: z.unknown(),
}).strict().superRefine((value, ctx) => {
  const checked = validateDocument(value.document);
  if (!checked.ok) ctx.addIssue({ code: "custom", message: checked.error.message, path: ["document"] });
});

export const templatesSchema = z.object({
  templates: z.array(templateSchema),
}).strict();

export type AdapterTemplate = z.infer<typeof templateSchema>;
