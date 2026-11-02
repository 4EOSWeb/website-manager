import path from "node:path";
import { pathToFileURL } from "node:url";
import { adapterSchema, parseAdapter, type AdapterContract } from "../adapter";
import { formatAdapterError, type AdapterErrorReport } from "../adapter/errors";
import { workspacePath } from "../adapter/serialize";
import { adapterInvalid } from "../errors";

export type AdapterValidation =
  | { ok: true; adapter: AdapterContract }
  | { ok: false; errors: AdapterErrorReport[] };

function unwrapModule(value: unknown) {
  if (value && typeof value === "object" && "default" in value) {
    const loaded = (value as { default?: unknown }).default;
    if (loaded && typeof loaded === "object") return loaded;
  }
  return value;
}

/** Parses an adapter value and returns field errors. It does not approve the site. */
export function validateAdapterValue(value: unknown): AdapterValidation {
  const parsed = parseAdapter(value);
  if (parsed.ok) return { ok: true, adapter: parsed.value };
  const schema = adapterSchema.safeParse(value);
  if (!schema.success) {
    return {
      ok: false,
      errors: schema.error.issues.map((issue) => formatAdapterError(adapterInvalid(issue.message, issue.path.join(".") || "adapter"))),
    };
  }
  return { ok: false, errors: [formatAdapterError(parsed.error)] };
}

export async function validateAdapterSource(read: () => Promise<unknown>): Promise<AdapterValidation> {
  try {
    return validateAdapterValue(unwrapModule(await read()));
  } catch {
    return { ok: false, errors: [formatAdapterError(adapterInvalid("The adapter file could not be read.", "adapter"))] };
  }
}

/** Reads one relative file from a workspace checkout. The client never imports that module. */
export async function validateAdapterFile(root: string, relativePath: string): Promise<AdapterValidation> {
  const checked = workspacePath(relativePath);
  if (!checked.ok) return { ok: false, errors: [formatAdapterError(checked.error)] };
  const base = path.resolve(root);
  const full = path.resolve(base, checked.value);
  if (full !== base && !full.startsWith(`${base}${path.sep}`)) {
    return { ok: false, errors: [formatAdapterError(adapterInvalid("Use a path inside the workspace.", "adapter"))] };
  }
  return validateAdapterSource(() => import(pathToFileURL(full).href));
}
