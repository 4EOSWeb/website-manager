import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/website_manager";

const quantumRoutes = ["/approach", "/solutions", "/insights", "/about", "/team", "/references", "/contact"];

test("a harbor page read does not return a quantum age page", async () => {
  const { pageForSite, pagesForSite } = await import("../../src/lib/pages.ts");
  const harbor = await pagesForSite("web_harbor");
  const quantum = await pagesForSite("web_quantum_age");
  assert.ok(harbor.length > 0);
  assert.ok(quantum.length > 0);
  const harborRoutes = harbor.map((page) => page.route);
  const quantumIds = new Set(quantum.map((page) => page.id));
  for (const route of quantumRoutes) assert.equal(harborRoutes.includes(route), false);
  assert.equal(harbor.some((page) => quantumIds.has(page.id)), false);
  assert.equal(harborRoutes.includes("/work") || harborRoutes.includes("/"), true);

  const quantumHome = quantum.find((page) => page.route === "/") ?? quantum[0];
  const harborHome = harbor.find((page) => page.route === "/") ?? harbor[0];
  assert.ok(quantumHome);
  assert.ok(harborHome);
  assert.equal(await pageForSite("web_harbor", quantumHome.id), null);
  const same = await pageForSite("web_harbor", harborHome.id);
  assert.equal(same?.id, harborHome.id);
  assert.equal(same?.route, harborHome.route);
  const quantumSame = await pageForSite("web_quantum_age", quantumHome.id);
  assert.equal(quantumSame?.id, quantumHome.id);
  assert.equal(quantum.some((page) => page.route === "/work"), false);
});
