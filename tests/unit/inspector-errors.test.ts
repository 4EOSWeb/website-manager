import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { documentInvalid } from "../../src/platform/errors.ts";
import { err, ok } from "../../src/platform/result.ts";
import { validateProps } from "../../src/platform/registry/props-schema.ts";
import { blocksSave, issuesFromProps, linkIssue } from "../../src/components/editor/inspector/errors-model.ts";

test("an invalid address stays a warning and a valid address clears it", () => {
  const insecure = linkIssue("http://example.com");
  assert.equal(insecure?.message, "Use the secure https:// version of this address.");
  assert.equal(insecure?.severity, "warning");
  assert.equal(linkIssue("https://example.com"), null);
  assert.equal(linkIssue("/contact"), null);
  assert.equal(blocksSave(insecure ? [insecure] : []), false);
  const fatal = { message: "Stop", severity: "fatal" as const };
  assert.equal(blocksSave([fatal]), true);
  assert.equal(blocksSave([]), false);
});

test("prop errors keep the typed value and default to a warning", () => {
  const schema = z.object({ label: z.string().min(1) }).strict();
  const failed = validateProps({ propsSchema: schema, propsSchemaId: "example.button" }, { label: "" });
  const issues = issuesFromProps(failed);
  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.severity, "warning");
  assert.equal(issues[0]?.path, "label");
  assert.equal(issuesFromProps(ok({ label: "Go" })).length, 0);
  const marked = err({ ...documentInvalid("This value cannot be saved."), fatal: true, path: "href" });
  assert.equal(issuesFromProps(marked)[0]?.severity, "fatal");
  const errors = readFileSync("src/components/editor/inspector/errors.tsx", "utf8");
  const model = readFileSync("src/components/editor/inspector/errors-model.ts", "utf8");
  const picker = readFileSync("src/components/editor/inspector/shared.tsx", "utf8");
  assert.equal(errors.includes('role="alert"'), true);
  assert.equal(picker.includes("setDraft(value)"), true);
  assert.equal(picker.includes("if (!linkProblem(value)) props.onChange(value.trim())"), true);
  assert.equal(picker.includes("FieldError"), true);
  const lowered = `${errors}\n${model}`.toLowerCase();
  assert.equal(lowered.includes("quantum"), false);
  assert.equal(lowered.includes("plum"), false);
  assert.equal(lowered.includes("hero"), false);
});
