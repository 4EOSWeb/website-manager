import { expect, test } from "@playwright/test";

test("each editor page list matches that site's routes", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/sites/web_harbor/editor");
  const harbor = page.locator(".ed-side");
  await expect(harbor.getByRole("button", { name: "Work", exact: true })).toBeVisible();
  await expect(harbor.getByRole("button", { name: "Approach", exact: true })).toHaveCount(0);

  await page.goto("/sites/web_quantum_age/editor");
  const quantum = page.locator(".ed-side");
  const approach = quantum.getByRole("button", { name: "Approach", exact: true });
  await expect(approach).toBeVisible();
  await expect(quantum.getByRole("button", { name: "Work", exact: true })).toHaveCount(0);
  await approach.click();
  await expect(approach).toHaveAttribute("aria-current", "page");
});
