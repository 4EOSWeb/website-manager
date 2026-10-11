import { createHash } from "node:crypto";

/** Stable checksum of one stored JSON value. Key order is the order the driver returned. */
export function draftChecksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
