import { test } from "node:test";
import assert from "node:assert/strict";
import { documentInvalid } from "../../src/platform/errors.ts";
import { err, ok, type Result } from "../../src/platform/result.ts";

function read(result: Result<number>): string {
  if (result.ok) return `value ${result.value}`;
  return result.error.code;
}

test("ok and err narrow", () => {
  assert.equal(read(ok(3)), "value 3");
  assert.equal(read(err(documentInvalid())), "document_invalid");
});
