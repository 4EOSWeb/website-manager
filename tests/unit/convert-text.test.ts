import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { migrateText } from "../../adapters/quantum-age/migrate-map.ts";
import { convertText } from "../../src/platform/migrate/convert-text.ts";

const adapter = { migrateText };

test("text blocks keep marks, styles, and locks, and eyebrow stays off the platform", () => {
  const marks = [{ start: 0, end: 4, kind: "bold" }];
  const heading = convertText({
    id: "blk_h",
    kind: "heading",
    hidden: false,
    locked: true,
    text: { text: "Hello", marks },
    textStyle: { preset: "title" },
  }, adapter);
  assert.ok(heading);
  assert.equal(heading.type, "heading");
  assert.deepEqual(heading.props.marks, marks);
  assert.deepEqual(heading.props.textStyle, { preset: "title" });
  assert.equal(heading.locked.locked, true);
  assert.equal(heading.visibility.hidden, false);

  const eyebrow = convertText({ id: "blk_e", kind: "eyebrow", text: { text: "Note", marks: [] }, hidden: true }, adapter);
  assert.equal(eyebrow?.type, "heading");
  assert.equal(eyebrow?.props.role, "eyebrow");
  assert.equal(eyebrow?.visibility.hidden, true);

  assert.equal(convertText({ id: "blk_p", kind: "paragraph", text: "Body" }, adapter)?.type, "text");
  assert.equal(convertText({ id: "blk_q", kind: "quote", text: { text: "Said", marks } }, adapter)?.type, "richtext");

  const unlocked = convertText({ id: "blk_u", kind: "paragraph", text: "Open", locked: false }, adapter);
  assert.equal(unlocked?.locked.locked, false);

  const platform = fs.readFileSync("src/platform/migrate/convert-text.ts", "utf8");
  assert.equal(platform.includes("eyebrow"), false);
  assert.match(fs.readFileSync("adapters/quantum-age/migrate-map.ts", "utf8"), /eyebrow/);
});
