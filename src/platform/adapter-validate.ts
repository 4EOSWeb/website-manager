import { adapterLevelSchema, type AdapterLevel } from "./adapter/level";
import { siteMetadataSchema, type SiteMetadata } from "./adapter/metadata";
import { adapterInvalid } from "./errors";
import { err, ok, type Result } from "./result";

export type AdapterIdentity = {
  version: 1;
  level: AdapterLevel;
  site: SiteMetadata;
};

export function validateAdapterIdentity(value: unknown): Result<AdapterIdentity> {
  if (value === null || typeof value !== "object") return err(adapterInvalid("The adapter must be an object.", "adapter"));
  const record = value as { version?: unknown; level?: unknown; site?: { id?: unknown; name?: unknown } };
  if (record.version !== 1) return err(adapterInvalid("The adapter version must be 1.", "version"));
  const level = adapterLevelSchema.safeParse(record.level);
  if (!level.success) return err(adapterInvalid("The integration level must be 1 or 2.", "level"));
  if (!record.site || typeof record.site !== "object") return err(adapterInvalid("The site record is required.", "site"));
  const metadata = siteMetadataSchema.safeParse(record.site);
  if (!metadata.success) {
    const issue = metadata.error.issues[0];
    const path = ["site", ...(issue?.path ?? [])].join(".");
    return err(adapterInvalid(issue?.message ?? "The site record is incomplete.", path));
  }
  return ok({ version: 1, level: level.data, site: metadata.data });
}
