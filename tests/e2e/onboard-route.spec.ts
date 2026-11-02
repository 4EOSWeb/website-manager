import { expect, test } from "@playwright/test";

test("an administrator can open the new-site route", async ({ page }) => {
  await page.goto("/sites/new");
  await expect(page.getByRole("heading", { name: "Connect a website" })).toBeVisible();
  const form = page.getByRole("form", { name: "Connect a website" });
  await expect(form).toBeVisible();
  await expect(form.locator('input[type="password"], input[name="token"]')).toHaveCount(0);
  const html = await form.innerHTML();
  expect(html.toLowerCase()).not.toMatch(/private key|access token/);

  await page.goto("/sites");
  await expect(page.getByRole("heading", { name: "Choose a website" })).toBeVisible();
});

test("a client editor cannot open the new-site route", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as client editor" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
  await page.goto("/sites/new");
  await expect(page.getByRole("heading", { name: "That page is not available" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connect a website" })).toHaveCount(0);
  await context.close();
});
