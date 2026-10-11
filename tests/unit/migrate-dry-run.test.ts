import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { breakpointWidth, migrateButton, migrateSection, migrateText } from "../../adapters/quantum-age/migrate-map.ts";
import { validateDocumentHook } from "../../adapters/quantum-age/validate.ts";
import type { SiteContext } from "../../src/platform/context.ts";
import { nodeSchema } from "../../src/platform/document/node.ts";
import { visualDocumentSchema } from "../../src/platform/document/document.ts";
import { assembleDraft } from "../../src/platform/migrate/assemble.ts";
import { redactedDraftV3 } from "./fixtures/redacted-draft-v3.ts";

const context: SiteContext = {
  clientId: "client_example",
  websiteId: "web_example",
  repository: "example",
  branch: "main",
  actorId: "user_example",
};

const adapter = { migrateText, migrateButton, migrateSection, breakpointWidth };

function explain(document: unknown) {
  const parsed = visualDocumentSchema.safeParse(document);
  if (!parsed.success) return parsed.error.issues.slice(0, 6);
  const pages = (document as { pages?: Array<{ root?: unknown }> }).pages ?? [];
  for (const page of pages) {
    const root = nodeSchema.safeParse(page.root);
    if (!root.success) return root.error.issues.slice(0, 6);
  }
  return [];
}

test("a redacted version 3 draft assembles without writing copy into the report", () => {
  const report = assembleDraft(redactedDraftV3, adapter, validateDocumentHook, context);
  assert.equal(report.ok, true, JSON.stringify({ errors: report.errors, issues: explain(report.document) }));
  assert.equal(report.detected, "3");
  assert.equal(report.shape, "site");
  assert.equal(report.validationOk, true);
  assert.equal(report.locksOk, true);
  assert.deepEqual(report.missingMedia, []);
  assert.equal(report.routes.length, 10);
  assert.equal(report.routes[0], "/");
  assert.equal(report.routes.includes("/contact"), true);
  const { document, ...published } = report;
  assert.equal(JSON.stringify(published).includes("Redacted"), false);
  assert.equal(document == null, false);
});

test("a home-shaped draft becomes one visual page and an unknown object is rejected", () => {
  const home = assembleDraft(
    { tagline: "A heading", positioning: "A paragraph", primaryButton: { href: "/contact", label: "Talk" } },
    adapter,
    validateDocumentHook,
    context,
  );
  assert.equal(home.ok, true, JSON.stringify({ errors: home.errors, issues: explain(home.document) }));
  assert.equal(home.detected, "unknown");
  assert.equal(home.shape, "home");
  assert.deepEqual(home.routes, ["/"]);
  const pages = (home.document as { pages: unknown[] }).pages;
  assert.equal(pages.length, 1);

  const rejected = assembleDraft({ hello: true }, adapter, validateDocumentHook, context);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.shape, "rejected");
  assert.equal(rejected.errors[0], "The document could not be converted.");
});

test("the assembler does not name a site inside the platform", () => {
  const source = readFileSync(new URL("../../src/platform/migrate/assemble.ts", import.meta.url), "utf8");
  assert.equal(/quantum|insights|heroimage|brand-mark|formula|plum|eyebrow/i.test(source), false);
});
