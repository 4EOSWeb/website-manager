import { expect, test as setup } from "@playwright/test";

setup("sign in as the administrator", async ({ page }) => {
  setup.setTimeout(180_000);
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as 4EOS administrator" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
  await page.context().storageState({ path: "tests/e2e/.auth/admin.json" });
  // The dev server compiles the editor and the preview on first use, which can outlast a test's own timeout.
  await page.goto("/sites/web_quantum_age/editor");
  await expect(page.frameLocator("#site-preview").locator(".eos-gap").first()).toBeAttached({ timeout: 150_000 });
});
