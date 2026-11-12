import { expect, test } from "@playwright/test";

test("an administrator edits Harbor without Quantum Age pages", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/sites/web_harbor/editor");
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Visit", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approach" })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
  const library = page.locator(".ed-library").first();
  await library.getByRole("textbox", { name: "Search sections and elements" }).fill("tide");
  await expect(library.getByRole("button", { name: "Tide clock" })).toBeVisible();
  await library.getByRole("textbox", { name: "Search sections and elements" }).fill("button");
  await library.getByRole("button", { name: "Button", exact: true }).first().click();
  await page.getByRole("button", { name: "Layers" }).click();
  await expect(page.getByRole("tree", { name: "Page layers" }).getByText("Button").first()).toBeVisible();
});
