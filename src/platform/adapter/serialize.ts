import type { SiteContext } from "../context";
import { validateDocument } from "../document/document";
import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";

export type SerializedFile = {
  path: string;
  contents: string;
};

export type SerializeHook = (document: unknown, context: SiteContext) => Result<SerializedFile[]>;

const documentPath = "src/content/editor/document.json";

export function workspacePath(value: string): Result<string> {
  if (!value || value.startsWith("/") || value.startsWith("\\") || /^[a-zA-Z]:/.test(value)) {
    return err(adapterInvalid("Use a path inside the workspace.", "path"));
  }
  if (value.split(/[\\/]/).includes("..")) {
    return err(adapterInvalid("Use a path inside the workspace.", "path"));
  }
  return ok(value);
}

export function writtenFiles(files: SerializedFile[]): Result<SerializedFile[]> {
  for (const file of files) {
    const checked = workspacePath(file.path);
    if (!checked.ok) return checked;
  }
  return ok(files);
}

/** Sites replace this hook. It is not called from the version 3 publish sync. */
export function serialize(document: unknown, _context: SiteContext): Result<SerializedFile[]> {
  const validated = validateDocument(document);
  if (!validated.ok) return validated;
  return writtenFiles([
    {
      path: documentPath,
      contents: `${JSON.stringify(validated.value)}\n`,
    },
  ]);
}
