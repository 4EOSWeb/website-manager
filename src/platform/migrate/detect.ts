import { migrationFailed, type PlatformError } from "../errors";

export type DetectedVersion = 3 | 1 | "unknown";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pageHasNodeRoot(page: unknown): boolean {
  if (!isRecord(page)) return false;
  const root = page.root;
  return isRecord(root) && typeof root.id === "string" && typeof root.type === "string";
}

/**
 * Identifies a version 3 site draft or a version 1 visual document.
 * The input is never written. An unknown value is a migration failure.
 */
export function detectVersion(value: unknown): DetectedVersion {
  if (!isRecord(value)) return "unknown";
  if (value.version === 3 && isRecord(value.chrome) && Array.isArray(value.pages)) return 3;
  if (
    value.version === 1 &&
    Array.isArray(value.pages) &&
    value.pages.length > 0 &&
    value.pages.every(pageHasNodeRoot)
  ) {
    return 1;
  }
  return "unknown";
}

/** Unknown documents surface `migration_failed`. Known documents have no error. */
export function detectionFailure(value: unknown): PlatformError | null {
  return detectVersion(value) === "unknown" ? migrationFailed() : null;
}
