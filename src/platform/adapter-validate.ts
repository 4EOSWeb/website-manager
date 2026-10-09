import { adapterInvalid } from "./errors";
import { err, ok, type Result } from "./result";

export type AdapterIdentity = {
  version: 1;
  site: { id: string; name: string };
};

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateAdapterIdentity(value: unknown): Result<AdapterIdentity> {
  if (value === null || typeof value !== "object") return err(adapterInvalid("The adapter must be an object.", "adapter"));
  const record = value as { version?: unknown; site?: { id?: unknown; name?: unknown } };
  if (record.version !== 1) return err(adapterInvalid("The adapter version must be 1.", "version"));
  if (!record.site || typeof record.site !== "object") return err(adapterInvalid("The site record is required.", "site"));
  if (!text(record.site.id)) return err(adapterInvalid("The site id is required.", "site.id"));
  if (!text(record.site.name)) return err(adapterInvalid("The site name is required.", "site.name"));
  return ok({ version: 1, site: { id: record.site.id, name: record.site.name } });
}
