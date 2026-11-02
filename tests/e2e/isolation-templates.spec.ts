import { expect, test } from "@playwright/test";

async function layoutValues(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Add page" }).click();
  const select = page.getByRole("combobox", { name: "Starting layout" });
  await expect(select).toBeVisible();
  return select.locator("option").evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value));
}

test("Add page lists only that site's templates", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/sites/web_harbor/editor");
  const harbor = await layoutValues(page);
  expect(harbor).toContain("harbor.visit");
  expect(harbor).toContain("blank");
  expect(harbor).not.toContain("insights-landing");
  expect(harbor.some((id) => id.includes("quantum-age"))).toBe(false);

  await page.goto("/sites/web_quantum_age/editor");
  const quantum = await layoutValues(page);
  expect(quantum).toContain("insights-landing");
  expect(quantum).toContain("blank");
  expect(quantum).not.toContain("harbor.visit");
  await page.getByRole("combobox", { name: "Starting layout" }).selectOption("insights-landing");
  await expect(page.getByRole("combobox", { name: "Starting layout" })).toHaveValue("insights-landing");
});
