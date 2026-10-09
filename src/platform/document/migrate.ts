import { migrationFailed } from "../errors";
import { err, ok, type Result } from "../result";

export type MigrationStep = {
  from: number;
  to: number;
  up: (value: unknown) => unknown;
  down: (value: unknown) => unknown;
};

function identity(value: unknown): unknown {
  return value;
}

/** Version 3 conversion is registered in step 7. Version 3 reads are removed in step 19.25. */
export const migrations: MigrationStep[] = [
  { from: 1, to: 1, up: identity, down: identity },
];

function readVersion(value: unknown): number | undefined {
  if (!value || typeof value !== "object" || !("version" in value)) return undefined;
  const version = (value as { version: unknown }).version;
  return typeof version === "number" ? version : undefined;
}

export function migrateDocument(value: unknown, to: number): Result<unknown> {
  if (!migrations.every((step) => typeof step.up === "function" && typeof step.down === "function")) {
    return err(migrationFailed());
  }
  const version = readVersion(value);
  if (version === undefined) return err(migrationFailed());
  if (version === to) {
    const stay = migrations.find((step) => step.from === version && step.to === version);
    if (!stay) return err(migrationFailed());
    return ok(stay.up(value));
  }
  let currentVersion = version;
  let current = value;
  const forward = to > version;
  for (let hop = 0; hop < migrations.length && currentVersion !== to; hop += 1) {
    const step = migrations.find((item) => item.from === currentVersion && item.to !== item.from && (forward ? item.to <= to : item.to >= to));
    if (!step) return err(migrationFailed());
    current = forward ? step.up(current) : step.down(current);
    currentVersion = step.to;
  }
  if (currentVersion !== to) return err(migrationFailed());
  return ok(current);
}
