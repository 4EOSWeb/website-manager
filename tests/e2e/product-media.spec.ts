import { expect, test } from "@playwright/test";
import { png } from "./helpers";

test("the media panel uses product type and accepts a png", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sites/web_harbor/editor");
  await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Media" }).click();
  const panel = page.locator(".product-media");
  await expect(panel.getByRole("heading", { name: "Media" })).toBeVisible();
  await expect(panel.getByText("Drop an image, or choose a file.")).toBeVisible();
  await expect(panel.getByText("No images have been added.")).toBeVisible();
  await expect(panel.locator(".ed-media-tile img")).toHaveCount(0);
  await expect(panel.locator(".ed-drop")).toHaveCSS("border-style", "solid");

  for (const [width, height, file] of [
    [1440, 900, "docs/product-hallmark/after/media-empty.png"],
    [768, 1024, "docs/product-hallmark/after/media-empty-768.png"],
    [390, 844, "docs/product-hallmark/after/media-empty-390.png"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await panel.screenshot({ path: file });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  const input = panel.locator('input[type="file"]');
  await input.focus();
  const outline = await panel.locator(".ed-drop").evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe("none");

  await input.setInputFiles({ name: "harbor-panel.png", mimeType: "image/png", buffer: png(8, 5) });
  const tile = panel.locator(".ed-media-tile").filter({ hasText: "8×5" }).first();
  await expect(tile).toBeVisible();
  await expect(panel.getByText("No images have been added.")).toHaveCount(0);
  await expect(tile.getByRole("button", { name: /^Delete/ })).toBeEnabled();
  await panel.screenshot({ path: "docs/product-hallmark/after/media-tile.png" });
  await tile.getByRole("button", { name: /^Delete/ }).click();
  await expect(panel.locator(".ed-media-tile").filter({ hasText: "8×5" })).toHaveCount(0);
});
