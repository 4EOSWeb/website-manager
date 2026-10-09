import { siteMetadataSchema, type SiteMetadata } from "./adapter/metadata";
import { adapterInvalid } from "./errors";
import { err, ok, type Result } from "./result";

export type AdapterIdentity = {
  version: 1;
  site: SiteMetadata;
};

export function validateAdapterIdentity(value: unknown): Result<AdapterIdentity> {
  if (value === null || typeof value !== "object") return err(adapterInvalid("The adapter must be an object.", "adapter"));
  const record = value as { version?: unknown; site?: { id?: unknown; name?: unknown } };
  if (record.version !== 1) return err(adapterInvalid("The adapter version must be 1.", "version"));
  if (!record.site || typeof record.site !== "object") return err(adapterInvalid("The site record is required.", "site"));
  const metadata = siteMetadataSchema.safeParse(record.site);
  if (!metadata.success) {
    const issue = metadata.error.issues[0];
    const path = ["site", ...(issue?.path ?? [])].join(".");
    return err(adapterInvalid(issue?.message ?? "The site record is incomplete.", path));
  }
  return ok({ version: 1, site: metadata.data });
}
