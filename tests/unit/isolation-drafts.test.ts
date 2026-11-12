import { createHash } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";

function checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

test("a draft write cannot name the other site's page", async () => {
  const { prisma } = await import("../../src/lib/prisma.ts");
  const { foreignDraftPageStatus } = await import("../../src/lib/pages.ts");
  const harbor = await prisma.workspaceDraft.findUnique({ where: { id: "draft_harbor_admin" } });
  assert.ok(harbor);
  let quantum = await prisma.workspaceDraft.findFirst({ where: { websiteId: "web_quantum_age" } });
  let created = false;
  if (!quantum) {
    created = true;
    quantum = await prisma.workspaceDraft.create({
      data: {
        id: "draft_iso_qa",
        websiteId: "web_quantum_age",
        userId: "user_admin",
        pageId: "page_home",
        draftData: { marker: "qa-isolation" },
      },
    });
  }
  const harborBefore = checksum(harbor.draftData);
  const quantumBefore = checksum(quantum.draftData);
  try {
    assert.equal(await foreignDraftPageStatus("web_harbor", { websiteId: "web_harbor", pageId: "page_home", draft: { pages: [{ id: "page_home" }] } }), 404);
    assert.equal(await foreignDraftPageStatus("web_quantum_age", { websiteId: "web_quantum_age", pageId: "page_harbor_home" }), 404);
    assert.equal(await foreignDraftPageStatus("web_harbor", { websiteId: "web_harbor", pageId: "page_harbor_home" }), null);
    assert.equal(await foreignDraftPageStatus("web_quantum_age", { websiteId: "web_quantum_age", pageId: "page_home" }), null);
    const harborAfter = await prisma.workspaceDraft.findUnique({ where: { id: harbor.id } });
    const quantumAfter = await prisma.workspaceDraft.findUnique({ where: { id: quantum.id } });
    assert.equal(checksum(harborAfter?.draftData), harborBefore);
    assert.equal(checksum(quantumAfter?.draftData), quantumBefore);
  } finally {
    if (created) await prisma.workspaceDraft.delete({ where: { id: "draft_iso_qa" } });
  }
});
