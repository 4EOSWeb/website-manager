import { expect, test } from "@playwright/test";

test("Harbor hides review and Quantum Age shows it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sites/web_harbor");
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Edit" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Media" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review" })).toHaveCount(0);

  for (const [width, height, file] of [
    [1440, 900, "docs/product-hallmark/after/dashboard.png"],
    [768, 1024, "docs/product-hallmark/after/dashboard-768.png"],
    [390, 844, "docs/product-hallmark/after/dashboard-390.png"],
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

  await page.getByRole("link", { name: /Edit/ }).click();
  await expect(page).toHaveURL(/\/sites\/web_harbor\/editor/);
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();

  await page.goto("/sites/web_quantum_age");
  await expect(page.getByRole("heading", { name: "Quantum Age" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await page.screenshot({ path: "docs/product-hallmark/after/dashboard-review.png", fullPage: true });
  await page.getByRole("link", { name: /Edit/ }).click();
  await expect(page).toHaveURL(/\/sites\/web_quantum_age\/editor/);
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
});
