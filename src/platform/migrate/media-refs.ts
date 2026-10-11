import { collectMedia } from "@/lib/editor-ops";
import { migrationFailed } from "../errors";
import { err, ok, type Result } from "../result";

/** Media filenames present in `before` and absent from `after`. */
export function missingMedia(before: unknown, after: unknown) {
  const source = collectMedia(before);
  const converted = collectMedia(after);
  return [...source].filter((name) => !converted.has(name));
}

/** Fails the conversion when a media reference would be dropped. Files are not moved. */
export function assertMediaPreserved(before: unknown, after: unknown): Result<true> {
  if (missingMedia(before, after).length > 0) return err(migrationFailed());
  return ok(true);
}
