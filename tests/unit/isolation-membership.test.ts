import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";

test("a Harbor member does not receive Quantum Age", async () => {
  const { prisma } = await import("../../src/lib/prisma.ts");
  const { websitesFor } = await import("../../src/lib/websites.ts");
  await prisma.user.upsert({
    where: { email: "harbor@4eos.test" },
    create: { id: "user_harbor_only", displayName: "Harbor Editor", email: "harbor@4eos.test", status: "ACTIVE" },
    update: { status: "ACTIVE", platformRole: null },
  });
  const harborUser = await prisma.user.findUnique({ where: { email: "harbor@4eos.test" } });
  assert.ok(harborUser);
  await prisma.websiteMembership.upsert({
    where: { userId_websiteId: { userId: harborUser.id, websiteId: "web_harbor" } },
    create: { id: "member_harbor_only", userId: harborUser.id, websiteId: "web_harbor", role: "CLIENT_EDITOR" },
    update: { role: "CLIENT_EDITOR" },
  });
  await prisma.websiteMembership.deleteMany({ where: { userId: harborUser.id, NOT: { websiteId: "web_harbor" } } });

  const harborSites = await websitesFor(harborUser);
  assert.deepEqual(harborSites.map((site) => site.id), ["web_harbor"]);

  const admin = await prisma.user.findUnique({ where: { id: "user_admin" } });
  assert.equal(admin?.platformRole, "SUPER_ADMIN");
  assert.ok(admin);
  const adminSites = (await websitesFor(admin)).map((site) => site.id);
  assert.equal(adminSites.includes("web_harbor"), true);
  assert.equal(adminSites.includes("web_quantum_age"), true);
});
