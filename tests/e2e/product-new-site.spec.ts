import { expect, test } from "@playwright/test";

test("the new-site form uses product fields and still rejects a bad id", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sites/new");
  await expect(page.getByRole("heading", { name: "Connect a website" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Steps" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Repository owner" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Default branch" })).toHaveValue("main");
  await expect(page.getByRole("textbox", { name: "Adapter path" })).toBeVisible();

  for (const [width, height, file] of [
    [1440, 900, "docs/product-hallmark/after/new-site.png"],
    [768, 1024, "docs/product-hallmark/after/new-site-768.png"],
    [390, 844, "docs/product-hallmark/after/new-site-390.png"],
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

  const id = page.getByRole("textbox", { name: "Site id" });
  await id.fill("WEB");
  await id.blur();
  await expect(page.getByRole("form", { name: "Connect a website" }).getByRole("alert")).toHaveText("Use a lowercase id that starts with a letter.");
});
