import { expect, test } from "@playwright/test";

test("the pages panel opens a route and keeps the product heading", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sites/web_harbor/editor");
  const panel = page.locator(".product-pages");
  await expect(panel.getByRole("heading", { name: "Pages" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Work", exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Approach" })).toHaveCount(0);

  for (const [width, height, file] of [
    [1440, 900, "docs/product-hallmark/after/pages.png"],
    [768, 1024, "docs/product-hallmark/after/pages-768.png"],
    [390, 844, "docs/product-hallmark/after/pages-390.png"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await panel.screenshot({ path: file });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await panel.getByRole("button", { name: "Home", exact: true }).focus();
  const shadow = await page.evaluate(() => getComputedStyle(document.activeElement as Element).boxShadow);
  expect(shadow).not.toBe("none");

  await panel.getByRole("button", { name: "Work", exact: true }).click();
  await expect(page.getByRole("button", { name: "Current page: Work. Show pages" })).toBeVisible();

  await panel.getByRole("button", { name: "Add page" }).click();
  await expect(page.getByRole("dialog", { name: "Add a page" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Add a page" })).toHaveCount(0);

  await panel.getByRole("textbox", { name: "Search pages" }).fill("zzzz-no-page");
  await expect(panel.getByText("No pages match")).toBeVisible();
  await expect(panel.getByText("Use part of a name or an address.")).toBeVisible();
  await expect(panel.getByText("This site has no pages yet.")).toBeHidden();
  await panel.screenshot({ path: "docs/product-hallmark/after/pages-search.png" });

  await panel.getByRole("textbox", { name: "Search pages" }).fill("");
  await page.evaluate(() => {
    const wrap = document.querySelector(".product-pages .product-empty-wrap");
    wrap?.removeAttribute("hidden");
    document.querySelectorAll(".product-pages .ed-group, .product-pages .ed-panel-head .ed-button").forEach((node) => node.setAttribute("hidden", ""));
  });
  await expect(panel.getByText("This site has no pages yet.")).toBeVisible();
  const emptyAdd = panel.locator(".product-empty").getByRole("button", { name: "Add page" });
  await expect(emptyAdd).toBeVisible();
  await panel.screenshot({ path: "docs/product-hallmark/after/pages-empty.png" });
  await emptyAdd.focus();
  const focusRing = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement as Element);
    return style.outlineStyle !== "none" || style.boxShadow !== "none";
  });
  expect(focusRing).toBe(true);
});

test("Quantum Age still lists its pages", async ({ page }) => {
  await page.goto("/sites/web_quantum_age/editor");
  const panel = page.locator(".product-pages");
  await expect(panel.getByRole("button", { name: "Home", exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Approach", exact: true })).toBeVisible();
  await expect(panel.getByText("This site has no pages yet.")).toBeHidden();
});
