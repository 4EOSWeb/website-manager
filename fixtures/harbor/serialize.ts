import { writtenFiles, type SerializedFile } from "../../src/platform/adapter/serialize";
import type { SiteContext } from "../../src/platform/context";
import { validateDocument } from "../../src/platform/document/document";
import { adapterInvalid } from "../../src/platform/errors";
import { err, type Result } from "../../src/platform/result";

const documentPath = "src/content/editor/document.json";

export function serializeHarbor(document: unknown, _context: SiteContext): Result<SerializedFile[]> {
  const validated = validateDocument(document);
  if (!validated.ok) return validated;
  if (documentPath.includes("insights") || documentPath.endsWith("home.json") || documentPath.startsWith("/") || documentPath.includes("..")) {
    return err(adapterInvalid("Use a path inside the Harbor workspace.", "path"));
  }
  return writtenFiles([{ path: documentPath, contents: `${JSON.stringify(validated.value)}\n` }]);
}
