import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseAdapter } from "./adapter";

export const version3EditorWarning = "No adapter is registered for this site. The version 3 editor stays in use.";

export type EditorAdapterView = {
  id: string;
  fields: Record<string, unknown>;
};

export function editorAdapterView(value: unknown): EditorAdapterView | null {
  const parsed = parseAdapter(value);
  if (!parsed.ok) return null;
  const fields = JSON.parse(JSON.stringify(parsed.value)) as Record<string, unknown>;
  delete fields.validateDocument;
  delete fields.serialize;
  return { id: parsed.value.site.id, fields };
}

function importUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as { message?: unknown; code?: unknown };
  const message = typeof record.message === "string" ? record.message : "";
  return record.code === "ERR_MODULE_NOT_FOUND" || message.includes("too dynamic") || message.includes("Cannot find module");
}

async function viewFromDisk(websiteId: string, root: string): Promise<EditorAdapterView | null> {
  if (!existsSync(root)) return null;
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = path.join(root, entry.name, "adapter.ts");
    if (!existsSync(file)) continue;
    const loaded = (await import(pathToFileURL(file).href)) as { default?: unknown };
    const view = editorAdapterView(loaded.default);
    if (view?.id === websiteId) return view;
  }
  return null;
}

function viewFromList(websiteId: string, bundled: readonly unknown[]) {
  for (const value of bundled) {
    const view = editorAdapterView(value);
    if (view?.id === websiteId) return view;
  }
  return null;
}

export async function loadEditorAdapter(
  websiteId: string,
  options?: { root?: string; bundled?: readonly unknown[] },
): Promise<EditorAdapterView | null> {
  const root = options?.root ?? path.join(process.cwd(), "adapters");
  try {
    const fromDisk = await viewFromDisk(websiteId, root);
    if (fromDisk) return fromDisk;
  } catch (error) {
    if (!importUnavailable(error)) throw error;
    const fromBundle = viewFromList(websiteId, options?.bundled ?? []);
    if (fromBundle) return fromBundle;
  }
  console.warn(version3EditorWarning);
  return null;
}
