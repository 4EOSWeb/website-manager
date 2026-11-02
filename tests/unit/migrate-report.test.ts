import assert from "node:assert/strict";
import { test } from "node:test";
import { conversionSucceeded, unmappedReport } from "../../src/platform/migrate/report.ts";

test("an unknown key is reported and is not omitted", () => {
  const output = { metadata: { unmapped: { surprise: true, kept: 1 } }, children: [] };
  const report = unmappedReport(output);
  assert.deepEqual(report.map((item) => item.key).sort(), ["kept", "surprise"]);
  assert.equal(report.every((item) => item.path === "metadata"), true);

  const failed = conversionSucceeded({
    output,
    beforeMedia: { src: "/media/photo.png" },
    afterMedia: { src: "/media/photo.png" },
    beforeRoutes: ["/contact"],
    afterRoutes: ["/contact"],
    beforeLocks: [],
    afterLocks: [],
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.report.some((item) => item.key === "surprise"), true);

  const passed = conversionSucceeded({
    output: { metadata: {} },
    beforeMedia: { src: "/media/photo.png" },
    afterMedia: { src: "/media/photo.png" },
    beforeRoutes: ["/contact"],
    afterRoutes: ["/"],
    beforeLocks: [{ id: "a", locked: false }],
    afterLocks: [{ id: "a", locked: { locked: false } }],
  });
  assert.equal(passed.ok, false);

  const clean = conversionSucceeded({
    output: { metadata: {} },
    beforeMedia: {},
    afterMedia: {},
    beforeRoutes: ["/contact"],
    afterRoutes: ["/contact"],
    beforeLocks: [{ id: "a", locked: false }],
    afterLocks: [{ id: "a", locked: { locked: false } }],
  });
  assert.equal(clean.ok, true);
  assert.deepEqual(clean.report, []);
});
