import { test } from "node:test";
import assert from "node:assert/strict";
import harborAdapter from "../../fixtures/harbor/adapter.ts";
import { siteDraftFromAdapter } from "../../src/lib/adapter-draft.ts";
import { activateWebsite } from "../../src/lib/onboarding-activate.ts";
import { prisma } from "../../src/lib/prisma.ts";
import { editorAdapterView } from "../../src/platform/editor-adapter.ts";
import { activationDecision } from "../../src/platform/onboarding/activate.ts";
import { compatibilityReport } from "../../src/app/sites/new/report-model.ts";

const websiteId = "web_activate_demo";

async function draftCount(id: string) {
  return prisma.workspaceDraft.count({ where: { websiteId: id } });
}

async function removeDemo() {
  await prisma.workspaceDraft.deleteMany({ where: { websiteId } });
  await prisma.websiteMembership.deleteMany({ where: { websiteId } });
  await prisma.website.deleteMany({ where: { id: websiteId } });
  await prisma.client.deleteMany({ where: { id: `client_${websiteId}` } });
}

test("a failed report cannot activate", async () => {
  const before = await draftCount("web_quantum_age");
  const decision = activationDecision([{ status: "fail" }]);
  assert.equal(decision.ok, false);
  if (!decision.ok) assert.equal(decision.status, 400);
  const created = await activateWebsite({
    actorId: "user_admin",
    websiteId,
    name: "Demo",
    productionUrl: "https://example.com",
    owner: "onboarding-check",
    repository: "not-a-real-repo",
    branch: "main",
    sections: [{ status: "fail" }],
    draftData: { version: 3 },
  });
  assert.equal(created.ok, false);
  assert.equal(await prisma.website.count({ where: { id: websiteId } }), 0);
  assert.equal(await draftCount("web_quantum_age"), before);
});

test("a passed report creates only the new site", async () => {
  const before = await draftCount("web_quantum_age");
  const view = editorAdapterView(harborAdapter);
  assert.ok(view);
  const sections = compatibilityReport({
    connection: { ok: true, message: "Pass" },
    adapter: { ok: true, message: "Pass" },
    routes: { ok: true, message: "Pass" },
    components: { ok: true, message: "Pass" },
    preview: { ok: true, message: "Pass" },
    serialization: { ok: true, message: "Pass" },
    build: { ok: true, message: "Pass" },
  });
  try {
    const created = await activateWebsite({
      actorId: "user_admin",
      websiteId,
      name: "Activation demo",
      productionUrl: "https://example.com",
      owner: "onboarding-check",
      repository: "not-a-real-repo",
      branch: "main",
      sections,
      draftData: siteDraftFromAdapter(view, "Activation demo"),
    });
    assert.equal(created.ok, true);
    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    assert.equal(website?.editorStatus, "APPROVED");
    assert.equal(website?.githubOwner, "onboarding-check");
    const draft = await prisma.workspaceDraft.findFirst({ where: { websiteId } });
    assert.equal(JSON.stringify(draft?.draftData).includes("Quantum Age"), false);
    assert.equal(JSON.stringify(draft?.visualDocument).includes("page_"), true);
    assert.equal(await prisma.website.count({ where: { id: "web_quantum_age" } }), 1);
    assert.equal(await draftCount("web_quantum_age"), before);
  } finally {
    await removeDemo();
  }
});
