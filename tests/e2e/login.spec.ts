import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("login keeps a primary action, a quiet development sign-in, and no sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/signin");
  await expect(page.getByRole("heading", { name: "Website editor" })).toBeVisible();
  await expect(page.locator(".border-dashed")).toHaveCount(0);
  if (await page.getByRole("button", { name: "Sign in with Microsoft" }).count()) {
    await expect(page.getByRole("button", { name: "Sign in with Microsoft" })).toBeVisible();
  } else {
    await expect(page.getByText("Sign-in is unavailable.")).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");

  await page.goto("/signin?error=CredentialsSignin");
  await expect(page.locator("main").getByRole("alert")).toHaveText("Sign-in did not complete. Try again.");

  await page.getByRole("button", { name: "Continue as 4EOS administrator" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
});
