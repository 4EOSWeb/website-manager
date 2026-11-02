import { expect, test } from "@playwright/test";

test("cross-site draft writes are rejected", async ({ page }) => {
  const harbor = await page.request.put("/api/sites/web_harbor/draft", {
    data: { websiteId: "web_harbor", pageId: "page_home", draft: { pages: [{ id: "page_home" }] } },
  });
  expect(harbor.status()).toBe(404);

  const quantum = await page.request.put("/api/sites/web_quantum_age/draft", {
    data: { websiteId: "web_quantum_age", pageId: "page_harbor_home", draft: { pages: [{ id: "page_harbor_home" }] } },
  });
  expect(quantum.status()).toBe(404);

  const sameSite = await page.request.put("/api/sites/web_quantum_age/draft", {
    data: { websiteId: "web_quantum_age", pageId: "page_home", draft: {} },
  });
  expect(sameSite.status()).toBe(400);
});
