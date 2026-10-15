import { expect, test } from "@playwright/test";

const paper = "rgb(247, 245, 240)";

test("Harbor does not inherit Quantum Age library entries or pages", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/sites/web_harbor/editor");
  await expect(page.getByRole("button", { name: "Visit", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approach" })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
  const library = page.locator(".ed-library").first();
  await expect(library.getByText("Insights summary")).toHaveCount(0);
  await expect(library.getByText("Freeform zone")).toHaveCount(0);
  await expect(library.getByText("Logo", { exact: true })).toHaveCount(0);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).not.toBe(paper);
  await page.goto("/sites/web_quantum_age/editor");
  await expect(page.getByRole("button", { name: "Approach", exact: true })).toBeVisible();
});
