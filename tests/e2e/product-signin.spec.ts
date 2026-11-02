import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("the sign-in screen uses the product system and development sign-in still works", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/signin");
  await expect(page.getByRole("heading", { name: "Website editor" })).toBeVisible();
  await expect(page.locator(".border-dashed")).toHaveCount(0);
  const html = await page.locator("main").innerHTML();
  expect(html).not.toMatch(/You will not see code|application id|tenant issuer/);
  if (await page.getByRole("button", { name: "Sign in with Microsoft" }).count()) {
    await expect(page.getByRole("button", { name: "Sign in with Microsoft" })).toBeVisible();
  } else {
    await expect(page.getByText("Sign-in is unavailable.")).toBeVisible();
  }

  for (const [width, height, file] of [
    [1440, 900, "docs/product-hallmark/after/login.png"],
    [768, 1024, "docs/product-hallmark/after/login-768.png"],
    [390, 844, "docs/product-hallmark/after/login-390.png"],
  ] as const) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.screenshot({ path: file, fullPage: true });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");

  await page.getByRole("button", { name: "Continue as 4EOS administrator" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
});

test("development access is secondary and both roles still sign in", async ({ browser }) => {
  const admin = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const adminPage = await admin.newPage();
  await adminPage.goto("/signin");
  await expect(adminPage.getByRole("heading", { name: "Development access" })).toBeVisible();
  await expect(adminPage.locator(".border-dashed")).toHaveCount(0);
  await adminPage.getByRole("button", { name: "Continue as 4EOS administrator" }).click();
  await expect(adminPage).not.toHaveURL(/\/signin/);
  await adminPage.goto("/sites/new");
  await expect(adminPage.getByRole("heading", { name: "Connect a website" })).toBeVisible();
  await admin.close();

  const editor = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const editorPage = await editor.newPage();
  await editorPage.goto("/signin");
  await editorPage.getByRole("button", { name: "Continue as client editor" }).click();
  await expect(editorPage).not.toHaveURL(/\/signin/);
  await editorPage.goto("/sites/new");
  await expect(editorPage.getByRole("heading", { name: "That page is not available" })).toBeVisible();
  await expect(editorPage.getByRole("heading", { name: "Connect a website" })).toHaveCount(0);
  await editor.close();
});

test("a failed sign-in shows one sentence and a later sign-in clears it", async ({ page }) => {
  await page.goto("/signin?error=CredentialsSignin");
  await expect(page.locator("main").getByRole("alert")).toHaveText("Sign-in did not complete. Try again.");
  const html = await page.locator("main").innerHTML();
  expect(html).not.toMatch(/CredentialsSignin|Error:|at\s+\//);
  await page.screenshot({ path: "docs/product-hallmark/after/login-error.png" });
  await page.getByRole("button", { name: "Continue as 4EOS administrator" }).click();
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
  await expect(page.getByText("Sign-in did not complete. Try again.")).toHaveCount(0);
});

test("the button says signing you in while the request is in flight", async ({ page }) => {
  await page.goto("/signin");
  await page.route("**/*", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  const click = page.getByRole("button", { name: "Continue as 4EOS administrator" }).click();
  await expect(page.getByRole("button", { name: "Signing you in" })).toBeVisible();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  await page.screenshot({ path: "docs/product-hallmark/after/login-pending.png" });
  await click;
  await expect(page).not.toHaveURL(/\/signin/);
});
