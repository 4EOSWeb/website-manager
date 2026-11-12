import { expect, test } from "@playwright/test";

test("a slow site list shows a labeled skeleton and then the list", async ({ page }) => {
  const pending = page.goto("/sites?slow=1");
  await expect(page.getByRole("status", { name: "Loading your websites." })).toBeVisible();
  await page.screenshot({ path: "docs/product-hallmark/after/loading.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await page.locator(".product-loading-bar").first().evaluate((node) => getComputedStyle(node).animationDuration);
  expect(duration === "0s" || duration === "0ms").toBe(true);
  await pending;
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
});

test("the add-page dialog uses address and template cards", async ({ page }) => {
  await page.goto("/sites/web_harbor/editor");
  await page.getByRole("button", { name: "Add page" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a page" });
  await expect(dialog.getByRole("textbox", { name: "Address" })).toBeVisible();
  await dialog.getByRole("radio", { name: "Blank canvas" }).check();
  await expect(dialog.getByRole("radio", { name: "Blank canvas" })).toBeChecked();
  await page.screenshot({ path: "docs/product-hallmark/after/add-page.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("a forced editor error can be retried and a healthy editor does not show it", async ({ page }) => {
  await page.goto("/sites/web_harbor/editor?boom=1");
  await expect(page.getByRole("heading", { name: "This page did not load." })).toBeVisible();
  await expect(page.locator("main")).not.toContainText("forced editor error");
  await expect(page.locator("main")).not.toContainText("node_modules");
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((node) => node.remove());
  });
  await page.screenshot({ path: "docs/product-hallmark/after/error.png" });
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "This page did not load." })).toBeVisible();
  await page.goto("/sites/web_harbor/editor");
  await expect(page.getByRole("heading", { name: "This page did not load." })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
});

test("administrators see each site's level and a client editor is denied", async ({ page, browser }) => {
  await page.goto("/sites/web_harbor/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Level 2")).toBeVisible();
  await expect(page.getByText("Can send for review").locator("xpath=..")).toContainText("No");
  await expect(page.getByText("npm run build")).toBeVisible();
  await page.screenshot({ path: "docs/product-hallmark/after/settings-harbor.png" });

  await page.goto("/sites/web_quantum_age/settings");
  await expect(page.getByText("Level 2")).toBeVisible();
  await expect(page.getByText("Can send for review").locator("xpath=..")).toContainText("Yes");
  await page.screenshot({ path: "docs/product-hallmark/after/settings-quantum.png" });

  const editor = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const editorPage = await editor.newPage();
  await editorPage.goto("/signin");
  await editorPage.getByRole("button", { name: "Continue as client editor" }).click();
  await expect(editorPage).not.toHaveURL(/\/signin/);
  await editorPage.goto("/sites/web_quantum_age/settings");
  await expect(editorPage.getByRole("heading", { name: "You do not have access to this website." })).toBeVisible();
  await expect(editorPage.getByRole("heading", { name: "Settings" })).toHaveCount(0);
  await editor.close();
});

test("account shows the signed-in person and sign out ends the session", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as 4EOS administrator" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await expect(page.getByText("admin@4eos.test")).toBeVisible();
  await expect(page.getByText("4EOS administrator", { exact: true })).toBeVisible();
  await page.screenshot({ path: "docs/product-hallmark/after/account.png" });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/signin/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/signin/);
  await context.close();
});

test("the hub not-found page links back and the editor account menu still signs out", async ({ page }) => {
  await page.goto("/this-page-is-missing");
  await expect(page.getByRole("heading", { name: "This page is not here." })).toBeVisible();
  const link = page.getByRole("link", { name: "Your websites" });
  await link.focus();
  await expect(link).toBeFocused();
  for (const [width, height, file] of [
    [1440, 900, "docs/product-hallmark/after/not-found.png"],
    [768, 1024, "docs/product-hallmark/after/not-found-768.png"],
    [390, 844, "docs/product-hallmark/after/not-found-390.png"],
  ] as const) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.screenshot({ path: file, fullPage: true });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sites/web_harbor/editor");
  await page.getByRole("button", { name: /Account:/ }).click();
  await expect(page.getByRole("menuitem", { name: "Account" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit for review" })).toHaveCount(0);
});

test("review stays available on Quantum Age and reports the real result", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/sites/web_quantum_age/editor");
  await page.getByRole("button", { name: "Submit for review" }).click();
  const review = page.getByRole("dialog", { name: "Send changes for review" });
  await expect(review.getByRole("button", { name: "Confirm it’s you" })).toBeVisible();
  await page.screenshot({ path: "docs/product-hallmark/after/review.png" });

  let held: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    held = resolve;
  });
  await page.route("**/api/sites/web_quantum_age/publish", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await gate;
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "The review could not be opened." }),
    });
  });
  await review.getByRole("button", { name: "Send for review" }).click();
  await expect(review.getByRole("status")).toHaveText("Sending for review");
  await expect(review.getByText("published")).toHaveCount(0);
  await page.screenshot({ path: "docs/product-hallmark/after/review-pending.png" });
  held?.();
  await expect(review.getByRole("status")).toHaveText("The review could not be opened.");

  await page.unroute("**/api/sites/web_quantum_age/publish");
  await page.route("**/api/sites/web_quantum_age/publish", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "SAVED_LOCALLY", message: "Home title\nWorkshop notes", reviewUrl: null }),
    });
  });
  await review.getByRole("button", { name: "Send for review" }).click();
  await expect(review.getByRole("status")).toHaveText("Saved for review on this copy. A pull request was not opened.");
  await expect(review.getByRole("heading", { name: "What will be sent" })).toBeVisible();
});
