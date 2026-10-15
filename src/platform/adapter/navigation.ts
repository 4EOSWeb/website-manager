import { z } from "zod";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

const itemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
}).strict();

export const navigationSchema = z.object({
  source: z.enum(["document", "adapter"]),
  editable: z.boolean(),
  items: z.array(itemSchema).optional(),
}).strict();

export type AdapterNavigation = z.infer<typeof navigationSchema>;

export function validateNavigation(supportsNavigationEditing: boolean, value: unknown): Result<AdapterNavigation> {
  const parsed = navigationSchema.safeParse(value);
  if (!parsed.success) return err(adapterInvalid("The navigation rules are not valid.", "navigation"));
  if (!supportsNavigationEditing && parsed.data.editable) {
    return err(adapterInvalid("Navigation editing is not available for this site.", "navigation.editable"));
  }
  if (parsed.data.source === "adapter" && !parsed.data.items) {
    return err(adapterInvalid("Adapter navigation needs its items.", "navigation.items"));
  }
  return ok(parsed.data);
}
