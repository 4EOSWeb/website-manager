import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { parseVersion3 } from "../../src/platform/migrate/parse-v3.ts";
import { redactedDraftV3 } from "./fixtures/redacted-draft-v3.ts";

test("the redacted version 3 draft parses and a partial document returns issues", () => {
  const parsed = parseVersion3(redactedDraftV3);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.version, 3);
  assert.deepEqual(
    parsed.value.pages.map((page) => page.route),
    ["/", "/solutions", "/approach", "/about", "/team", "/references", "/insights", "/contact", "/privacy", "/terms"],
  );

  const invalid = { version: 3 };
  const before = JSON.stringify(invalid);
  const failed = parseVersion3(invalid);
  assert.equal(failed.ok, false);
  if (failed.ok) return;
  assert.equal(JSON.stringify(invalid), before);
  assert.ok(failed.issues.length >= 3);
  assert.equal(
    failed.issues.map((issue) => issue.message).join(" "),
    "Invalid input: expected object, received undefined Invalid input: expected array, received undefined Invalid input: expected array, received undefined",
  );
});

test("version 3 parsing stays out of the document package", () => {
  const header = fs.readFileSync("src/platform/migrate/parse-v3.ts", "utf8");
  assert.match(header, /Remove this import in step 19\.25/);
  assert.match(header, /siteDraftSchema/);
  const docs = fs.readFileSync("docs/architecture-separation.md", "utf8");
  assert.match(docs, /src\/platform\/migrate\/parse-v3\.ts/);
  assert.match(docs, /step 19\.25/);

  const root = "src/platform/document";
  for (const name of fs.readdirSync(root)) {
    if (!name.endsWith(".ts")) continue;
    const source = fs.readFileSync(path.join(root, name), "utf8");
    assert.equal(source.includes("content-schema"), false, name);
    assert.equal(source.includes("siteDraftSchema"), false, name);
  }
});
