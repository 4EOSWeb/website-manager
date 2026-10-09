import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateAdapterIdentity } from "./adapter-validate";
import { err, ok, type Result } from "./result";
import { adapterInvalid } from "./errors";

export async function discoverAdapters(root: string): Promise<Result<string[]>> {
  const entries = await readdir(root, { withFileTypes: true });
  const ids: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = path.join(root, entry.name, "adapter.ts");
    if (!existsSync(file)) continue;
    const loaded = (await import(pathToFileURL(file).href)) as { default?: unknown };
    const checked = validateAdapterIdentity(loaded.default);
    if (!checked.ok) return err(adapterInvalid(checked.error.message, checked.error.path));
    ids.push(checked.value.site.id);
  }
  return ok(ids);
}
