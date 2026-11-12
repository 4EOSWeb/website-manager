import { adapterInvalid } from "../errors";
import { err, ok, type Result } from "../result";
import { workspacePath } from "./serialize";

function matchesPrefix(path: string, prefix: string): boolean {
  if (prefix.endsWith("/")) return path.startsWith(prefix);
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function assertAllowed(path: string, allowlist: string[]): Result<string> {
  const checked = workspacePath(path);
  if (!checked.ok) return checked;
  if (!allowlist.some((prefix) => matchesPrefix(checked.value, prefix))) {
    return err(adapterInvalid("That file is not on the publish list.", "path"));
  }
  return ok(checked.value);
}
