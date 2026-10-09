import { z } from "zod";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

export const sharedLayoutSchema = z.object({
  header: z.enum(["required", "optional", "none"]),
  footer: z.enum(["required", "optional", "none"]),
}).strict();

export type SharedLayout = z.infer<typeof sharedLayoutSchema>;

export function validateSharedLayout(supportsSharedLayouts: boolean, value: unknown): Result<SharedLayout> {
  const parsed = sharedLayoutSchema.safeParse(value);
  if (!parsed.success) return err(adapterInvalid("The shared layout is not valid.", "sharedLayout"));
  if (!supportsSharedLayouts && (parsed.data.header !== "none" || parsed.data.footer !== "none")) {
    return err(adapterInvalid("Shared layouts are not available for this site.", "sharedLayout.header"));
  }
  return ok(parsed.data);
}
