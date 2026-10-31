import { expect, test } from "@playwright/test";

test("a harbor url for a quantum age page id is not found", async ({ page }) => {
  const harborList = await page.request.get("/api/sites/web_harbor/pages");
  expect(harborList.status()).toBe(200);
  const harbor = (await harborList.json()) as { pages: { id: string; route: string; title: string }[] };
  expect(harbor.pages.map((item) => item.route)).not.toContain("/approach");
  expect(harbor.pages.map((item) => item.title)).not.toContain("Approach");

  const quantumList = await page.request.get("/api/sites/web_quantum_age/pages");
  expect(quantumList.status()).toBe(200);
  const quantum = (await quantumList.json()) as { pages: { id: string; route: string }[] };
  const quantumHome = quantum.pages.find((item) => item.route === "/");
  const harborHome = harbor.pages.find((item) => item.route === "/");
  expect(quantumHome).toBeTruthy();
  expect(harborHome).toBeTruthy();

  const cross = await page.request.get(`/api/sites/web_harbor/pages?id=${encodeURIComponent(quantumHome!.id)}`);
  expect(cross.status()).toBe(404);
  const same = await page.request.get(`/api/sites/web_harbor/pages?id=${encodeURIComponent(harborHome!.id)}`);
  expect(same.status()).toBe(200);
  const quantumSame = await page.request.get(`/api/sites/web_quantum_age/pages?id=${encodeURIComponent(quantumHome!.id)}`);
  expect(quantumSame.status()).toBe(200);
});
