import fs from "node:fs";
import path from "node:path";

export const nothingConnected = "Nothing was connected.";

/** Removes a failed id’s checkout and leaves every other directory in place. */
export function recoverFailedConnection(input: { root: string; websiteId: string; inserted: boolean }) {
  if (!input.inserted) {
    const base = path.resolve(input.root);
    const target = path.resolve(base, input.websiteId);
    if (target.startsWith(`${base}${path.sep}`) && path.basename(target) === input.websiteId && fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
  return { message: input.inserted ? "" : nothingConnected };
}
