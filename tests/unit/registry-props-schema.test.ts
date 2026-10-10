import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { validateProps } from "../../src/platform/registry/props-schema.ts";

test("strict prop schemas name the extra field", () => {
  const definition = {
    propsSchemaId: "button",
    propsSchema: z.object({ label: z.string() }).strict(),
  };
  const extra = validateProps(definition, { label: "Go", extra: true });
  assert.equal(extra.ok, false);
  if (!extra.ok) {
    assert.equal(extra.error.path, "extra");
    assert.equal(extra.error.message.includes("extra"), true);
  }
  assert.equal(validateProps(definition, { label: "Go" }).ok, true);
  const route = readFileSync(new URL("../../src/app/api/sites/[websiteId]/draft/route.ts", import.meta.url), "utf8");
  assert.equal(route.includes("siteDraftSchema"), true);
  assert.equal(route.includes("zodFieldErrors"), true);
});
