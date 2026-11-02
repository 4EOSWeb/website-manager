import { expect, test } from "@playwright/test";

test("an administrator sees both sites as cards and can edit each one", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sites");
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose a website" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Connect a website" })).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quantum Age" })).toBeVisible();
  await expect(page.getByText("harbor.example")).toBeVisible();
  await expect(page.getByText("testsite.4eos.com")).toBeVisible();

  for (const [width, height, file] of [
    [1440, 900, "docs/product-hallmark/after/sites.png"],
    [768, 1024, "docs/product-hallmark/after/sites-768.png"],
    [390, 844, "docs/product-hallmark/after/sites-390.png"],
  ] as const) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.screenshot({ path: file, fullPage: true });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");

  await page.getByRole("link", { name: "Edit Harbor & Co." }).click();
  await expect(page).toHaveURL(/\/sites\/web_harbor\/editor/);
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();

  await page.goto("/sites");
  await page.getByRole("link", { name: "Edit Quantum Age" }).click();
  await expect(page).toHaveURL(/\/sites\/web_quantum_age\/editor/);
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
});

test("a client editor does not see connect on the website list", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as client editor" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
  await page.goto("/sites");
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connect a website" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Quantum Age" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toHaveCount(0);
  await context.close();
});
