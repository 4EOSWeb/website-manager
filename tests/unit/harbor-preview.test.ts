import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { editorAdapterForSite } from "../../src/lib/editor-adapter.ts";
import { ensureWorkspace } from "../../src/lib/workspace.ts";

test("harbor preview uses the adapter workspace and keeps the iframe transport", async () => {
  const view = await editorAdapterForSite("web_harbor");
  assert.ok(view);
  assert.equal((view.fields.workspace as { root: string }).root, "fixtures/harbor");
  assert.equal((view.fields.preview as { transport: string }).transport, "iframe-postmessage");
  const dir = await ensureWorkspace("web_harbor");
  assert.equal(dir, path.join(process.cwd(), "fixtures", "harbor"));
  assert.equal(existsSync(path.join(dir, "src", "platform", "canvas", "runtime.ts")), true);
  const hub = readFileSync("src/lib/workspace.ts", "utf8") + readFileSync("src/app/preview/[websiteId]/[[...path]]/route.ts", "utf8");
  assert.equal(hub.includes("fixtures/harbor/src/components"), false);
  assert.equal(hub.includes('websiteId === "web_harbor"'), false);
  assert.equal(hub.includes('websiteId === "web_quantum_age"'), false);
  const platform = readFileSync("src/platform/editor-adapter.ts", "utf8");
  assert.equal(platform.includes("web_harbor"), false);
});
