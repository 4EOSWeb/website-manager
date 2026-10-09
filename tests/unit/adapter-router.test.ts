import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routerSchema } from "../../src/platform/adapter/router.ts";

test("app and pages roots pass, including a nested app path", () => {
  assert.equal(routerSchema.safeParse({ kind: "app", root: "src/app" }).success, true);
  assert.equal(routerSchema.safeParse({ kind: "pages", root: "src/pages" }).success, true);
  assert.equal(routerSchema.safeParse({ kind: "app", root: "src/app/insights" }).success, true);
  assert.equal(routerSchema.safeParse({ kind: "app", root: "/src/app" }).success, false);
  assert.equal(routerSchema.safeParse({ kind: "pages", root: "../pages" }).success, false);
  const source = readFileSync(new URL("../../src/platform/adapter/router.ts", import.meta.url), "utf8");
  assert.equal(source.includes("insights"), false);
});
