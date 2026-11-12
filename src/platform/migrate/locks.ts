import { migrationFailed } from "../errors";
import { err, ok, type Result } from "../result";

export type LockSource = {
  id: string;
  locked?: boolean;
  providerLocked?: boolean;
};

export type LockOutput = {
  id: string;
  locked?: boolean | { locked?: boolean };
  source?: { providerManaged?: boolean };
};

function outputLocked(node: LockOutput) {
  if (node.locked === true) return true;
  if (node.locked && typeof node.locked === "object" && node.locked.locked === true) return true;
  return node.source?.providerManaged === true;
}

function sourceLocked(node: LockSource) {
  return node.locked === true || node.providerLocked === true;
}

/** Fails when a locked region becomes unlocked, or an unlocked region becomes locked. */
export function assertLocksPreserved(before: LockSource[], after: LockOutput[]): Result<true> {
  for (const source of before) {
    const found = after.find((item) => item.id === source.id);
    const required = sourceLocked(source);
    if (required && (!found || !outputLocked(found))) return err(migrationFailed());
    if (!required && found && outputLocked(found)) return err(migrationFailed());
  }
  return ok(true);
}
