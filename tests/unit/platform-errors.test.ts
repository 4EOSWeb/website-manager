import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adapterInvalid,
  adapterNotFound,
  capabilityMissing,
  documentInvalid,
  lockedError,
  migrationFailed,
  nodeNotFound,
  parentRejected,
  platformErrorCodes,
} from "../../src/platform/errors.ts";

const helpers = {
  adapter_not_found: adapterNotFound,
  adapter_invalid: adapterInvalid,
  capability_missing: capabilityMissing,
  document_invalid: documentInvalid,
  node_not_found: nodeNotFound,
  parent_rejected: parentRejected,
  locked: lockedError,
  migration_failed: migrationFailed,
} as const;

test("every platform error code has a helper and no site name", () => {
  for (const code of platformErrorCodes) {
    const error = helpers[code]();
    assert.equal(error.code, code);
    assert.match(error.message, /\S/);
    assert.equal(/quantum age|insights|hero/i.test(error.message), false);
  }
});
