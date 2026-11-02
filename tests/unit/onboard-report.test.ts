import { test } from "node:test";
import assert from "node:assert/strict";
import { assembleReport } from "../../src/app/sites/new/assemble.ts";
import { compatibilityReport } from "../../src/app/sites/new/report-model.ts";

const harborDraft = {
  owner: "harbor",
  repository: "harbor-site",
  branch: "main",
  adapterPath: "fixtures/harbor/adapter.ts",
  contentPath: "src/content",
  mediaPath: "public",
  themeSource: "adapter",
  navigationSource: "document" as const,
};

test("a passing harbor run marks every section pass", async () => {
  const sections = await assembleReport(harborDraft, {
    root: process.cwd(),
    lookup: async () => ({ found: true }),
    listen: async () => true,
    audience: "client-admin",
    runBuild: async () => ({ code: 0, log: "built" }),
  });
  assert.equal(sections.length, 7);
  assert.equal(sections.every((section) => section.status === "pass" && section.message === "Pass"), true);
  const rendered = JSON.stringify(sections);
  assert.equal(rendered.includes("src/"), false);
  assert.equal(rendered.includes("token"), false);
  assert.equal(rendered.includes("fixtures/"), false);
});

test("a failed check stays visible and a token is left out", () => {
  const sections = compatibilityReport({
    connection: { ok: false, message: "That repository was not found.\n    at lookup ghp_shouldnotappear" },
    adapter: { ok: true, message: "Pass" },
    routes: { ok: true, message: "Pass" },
    components: { ok: true, message: "Pass" },
    preview: { ok: false, message: "The preview did not respond." },
    serialization: { ok: true, message: "Pass" },
    build: { ok: true, message: "Pass" },
  });
  const connection = sections.find((section) => section.id === "connection");
  assert.equal(connection?.status, "fail");
  assert.match(connection?.message ?? "", /not found/);
  assert.equal(connection?.message.includes("\n"), false);
  assert.equal(JSON.stringify(sections).includes("ghp_shouldnotappear"), false);
  assert.equal(sections.find((section) => section.id === "preview")?.message, "The preview did not respond.");
});
