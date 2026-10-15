import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { themeSchema } from "../../src/platform/adapter/theme.ts";
import { quantumAgeTheme } from "../../adapters/quantum-age/theme.ts";

test("quantum age color tokens match the draft chrome", () => {
  const saved = JSON.parse(readFileSync(new URL("../e2e/.auth/drafts.json", import.meta.url), "utf8")) as {
    drafts: { id: string; draft_data: { chrome?: { theme?: Record<string, string> } } | string }[];
  };
  const row = saved.drafts.find((item) => item.id === "draft_0ddb6f7c7f7a");
  const draft = typeof row?.draft_data === "string" ? JSON.parse(row.draft_data) : row?.draft_data;
  const theme = draft.chrome.theme as Record<string, string>;
  assert.equal(themeSchema.safeParse(quantumAgeTheme).success, true);
  for (const token of quantumAgeTheme.tokens) assert.equal(token.value, theme[token.id]);
  const scan = spawnSync("rg", ["plum", "src/platform"], { encoding: "utf8" });
  assert.equal(scan.stdout, "");
  assert.equal(scan.status, 1);
});
