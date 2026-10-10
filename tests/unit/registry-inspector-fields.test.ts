import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { inspectorFields } from "../../src/platform/registry/inspector-fields.ts";

test("a string prop becomes a text control and unknown types are skipped", () => {
  const generated = inspectorFields(z.object({
    label: z.string(),
    tone: z.enum(["quiet", "bold"]),
    featured: z.boolean(),
    count: z.number(),
    when: z.date(),
  }));
  assert.deepEqual(generated.fields[0], { prop: "label", label: "Label", control: "text" });
  assert.equal(generated.fields.find((field) => field.prop === "tone")?.control, "radio");
  assert.equal(generated.fields.find((field) => field.prop === "featured")?.control, "switch");
  assert.equal(generated.fields.find((field) => field.prop === "count")?.control, "number");
  const skipped = generated.fields.find((field) => field.prop === "when");
  assert.equal(skipped?.control, "skipped");
  assert.match(skipped?.warning ?? "", /when/i);
  assert.equal(generated.warnings.length, 1);
  const many = inspectorFields(z.object({ size: z.enum(["a", "b", "c", "d"]) }));
  assert.equal(many.fields[0]?.control, "select");
  const source = readFileSync(new URL("../../src/platform/registry/inspector-fields.ts", import.meta.url), "utf8");
  assert.equal(source.includes("react"), false);
});
