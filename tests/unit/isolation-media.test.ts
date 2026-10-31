import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";

const quantumPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const harborPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

test("a harbor request for a quantum age media id is not found", async () => {
  const { prisma } = await import("../../src/lib/prisma.ts");
  const { mediaRoot, readMediaById, storeImage } = await import("../../src/lib/media.ts");
  const quantum = await storeImage({
    websiteId: "web_quantum_age",
    userId: "user_admin",
    bytes: quantumPng,
    altText: "quantum-mark.png",
  });
  const harbor = await storeImage({
    websiteId: "web_harbor",
    userId: "user_admin",
    bytes: harborPng,
    altText: "harbor-pier.png",
  });
  try {
    const cross = await readMediaById("web_harbor", quantum.id);
    assert.equal(cross, null);
    const same = await readMediaById("web_quantum_age", quantum.id);
    assert.ok(same);
    assert.equal(same.asset.websiteId, "web_quantum_age");
    assert.ok(same.bytes.length > 0);
    const harborSame = await readMediaById("web_harbor", harbor.id);
    assert.equal(harborSame?.asset.id, harbor.id);
    assert.equal(harborSame?.asset.websiteId, "web_harbor");
    const harborNames = (await prisma.mediaAsset.findMany({ where: { websiteId: "web_harbor" } })).map((item) => item.filename);
    const quantumNames = (await prisma.mediaAsset.findMany({ where: { websiteId: "web_quantum_age" } })).map((item) => item.filename);
    assert.equal(harborNames.includes(quantum.filename), false);
    assert.equal(quantumNames.includes(harbor.filename), false);
    assert.equal(fs.existsSync(path.join(mediaRoot("web_harbor"), quantum.filename)), false);
    assert.equal(fs.existsSync(path.join(mediaRoot("web_quantum_age"), quantum.filename)), true);
  } finally {
    for (const asset of [quantum, harbor]) {
      const file = path.join(mediaRoot(asset.websiteId), asset.filename);
      if (fs.existsSync(file)) fs.unlinkSync(file);
      await prisma.mediaAsset.delete({ where: { id: asset.id } }).catch(() => undefined);
    }
  }
});
