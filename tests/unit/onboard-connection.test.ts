import { test } from "node:test";
import assert from "node:assert/strict";
import { canConnectWebsite } from "../../src/lib/roles.ts";
import { connectionResponse, validateConnection } from "../../src/platform/onboarding/validate-connection.ts";

const leaked = "ghp_shouldnotappear";

test("a found repository returns no token", async () => {
  const result = await validateConnection({ owner: "acme", repository: "site" }, async () => ({ found: true, problem: leaked }));
  assert.deepEqual(result, { ok: true, found: true });
  assert.equal(JSON.stringify(result).includes("token"), false);
  assert.equal(JSON.stringify(result).includes(leaked), false);
});

test("a missing repository is a failed result without a stack", async () => {
  const missing = await validateConnection({ owner: "acme", repository: "missing" }, async () => ({ found: false }));
  assert.deepEqual(missing, { ok: false, problem: "That repository was not found." });
  const thrown = await validateConnection({ owner: "acme", repository: "missing" }, async () => {
    throw new Error(`${leaked}\n    at lookup (connection.ts:1:1)`);
  });
  assert.equal(thrown.ok, false);
  if (!thrown.ok) {
    assert.equal(thrown.problem, "That repository could not be checked.");
    assert.equal(thrown.problem.includes(leaked), false);
    assert.equal(thrown.problem.includes("at lookup"), false);
  }
});

test("a client editor is refused", () => {
  const allowed = canConnectWebsite(null, ["CLIENT_EDITOR"]);
  const response = connectionResponse(allowed, { ok: true, found: true });
  assert.equal(response.status, 403);
  assert.equal(JSON.stringify(response.body).includes(leaked), false);
});
