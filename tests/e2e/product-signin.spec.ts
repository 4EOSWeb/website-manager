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
  await expect(page.getByRole("heading", { name: "Choose a website" })).toBeVisible();
});
