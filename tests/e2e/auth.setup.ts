import { expect, test as setup } from "@playwright/test";

setup("sign in as the administrator", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as 4EOS administrator" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
  await page.context().storageState({ path: "tests/e2e/.auth/admin.json" });
});
