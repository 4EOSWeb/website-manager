import { z } from "zod";
import type { AdapterLevel } from "./level";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

export const pageCapabilitySchema = z.object({
  editMetadata: z.boolean().optional(),
  editHeader: z.boolean().optional(),
  editBody: z.boolean().optional(),
  editSidebar: z.boolean().optional(),
  editCta: z.boolean().optional(),
  lockLayout: z.boolean().optional(),
  lockContent: z.boolean().optional(),
  providerManaged: z.boolean().optional(),
}).strict();

export type PageCapabilities = {
  editMetadata: boolean;
  editHeader: boolean;
  editBody: boolean;
  editSidebar: boolean;
  editCta: boolean;
  lockLayout: boolean;
  lockContent: boolean;
  providerManaged: boolean;
};

export function defaultPageCapabilities(level: AdapterLevel): PageCapabilities {
  return {
    editMetadata: true,
    editHeader: false,
    editBody: level === 2,
    editSidebar: false,
    editCta: false,
    lockLayout: false,
    lockContent: false,
    providerManaged: false,
  };
}

export function resolvePageCapabilities(level: AdapterLevel, value: unknown = {}): Result<PageCapabilities> {
  const parsed = pageCapabilitySchema.safeParse(value);
  if (!parsed.success) return err(adapterInvalid("The page flags are not valid.", "page"));
  const flags = { ...defaultPageCapabilities(level), ...parsed.data };
  if (flags.providerManaged && flags.editBody) {
    return err(adapterInvalid("A provider-managed page cannot edit its body.", "page.editBody"));
  }
  return ok(flags);
}
