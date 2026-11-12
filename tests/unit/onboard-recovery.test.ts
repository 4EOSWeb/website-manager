import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nothingConnected, recoverFailedConnection } from "../../src/platform/onboarding/recover.ts";

test("a failed connection removes only that checkout", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "onboard-"));
  const kept = path.join(root, "web_quantum_age");
  const failed = path.join(root, "web_failed_demo");
  fs.mkdirSync(kept);
  fs.writeFileSync(path.join(kept, "keep.txt"), "stay");
  fs.mkdirSync(failed);
  fs.writeFileSync(path.join(failed, "partial.txt"), "go");
  const recovered = recoverFailedConnection({ root, websiteId: "web_failed_demo", inserted: false });
  assert.equal(recovered.message, nothingConnected);
  assert.equal(fs.existsSync(failed), false);
  assert.equal(fs.readFileSync(path.join(kept, "keep.txt"), "utf8"), "stay");
  const escaped = recoverFailedConnection({ root, websiteId: "../web_quantum_age", inserted: false });
  assert.equal(escaped.message, nothingConnected);
  assert.equal(fs.existsSync(kept), true);
  fs.rmSync(root, { recursive: true, force: true });
});
