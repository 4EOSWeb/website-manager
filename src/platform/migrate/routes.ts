import { migrationFailed } from "../errors";
import { err, ok, type Result } from "../result";

/** Fails when a route is missing or duplicated. Order does not matter. */
export function assertRoutesPreserved(before: string[], after: string[]): Result<true> {
  const source = new Set(before);
  const converted = new Set(after);
  if (source.size !== before.length || converted.size !== after.length) return err(migrationFailed());
  if (source.size !== converted.size || [...source].some((route) => !converted.has(route))) return err(migrationFailed());
  return ok(true);
}
