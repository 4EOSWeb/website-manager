import { expect, test, type Page } from "@playwright/test";

async function layoutValues(page: Page) {
  await page.getByRole("button", { name: "Add page" }).click();
  const group = page.getByRole("radiogroup", { name: "Starting layout" });
  await expect(group).toBeVisible();
  return group.getByRole("radio").evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
}

test("Add page lists only that site's templates", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/sites/web_harbor/editor");
  const harbor = await layoutValues(page);
  expect(harbor).toContain("harbor.visit");
  expect(harbor).toContain("blank");
  expect(harbor).toContain("canvas");
  expect(harbor).not.toContain("insights-landing");
  expect(harbor.some((id) => id.includes("quantum-age"))).toBe(false);
  await expect(page.getByRole("radio", { name: "Visit" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Insights landing" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.goto("/sites/web_quantum_age/editor");
  const quantum = await layoutValues(page);
  expect(quantum).toContain("insights-landing");
  expect(quantum).toContain("blank");
  expect(quantum).toContain("canvas");
  expect(quantum).not.toContain("harbor.visit");
  await page.getByRole("radio", { name: "Blank canvas" }).check();
  await expect(page.getByRole("radio", { name: "Blank canvas" })).toBeChecked();
  await page.getByRole("radio", { name: "Insights landing" }).check();
  await expect(page.getByRole("radio", { name: "Insights landing" })).toBeChecked();
});
