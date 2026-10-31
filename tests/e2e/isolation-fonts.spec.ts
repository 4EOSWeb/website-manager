import { expect, test } from "@playwright/test";

async function fontOptions(page: import("@playwright/test").Page) {
  await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
  const library = page.locator(".ed-library").first();
  await library.getByRole("textbox", { name: "Search sections and elements" }).fill("button");
  await library.getByRole("button", { name: "Button", exact: true }).first().click();
  const select = page.getByRole("combobox", { name: "Font" });
  await expect(select).toBeVisible();
  return select.locator("option").allTextContents();
}

test("Harbor's button font menu lists only Harbor families", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/sites/web_harbor/editor");
  const harbor = await fontOptions(page);
  expect(harbor).toEqual(expect.arrayContaining(["Fraunces", "IBM Plex Sans"]));
  expect(harbor).not.toContain("Figtree");
  expect(harbor).not.toContain("Source Serif 4");

  await page.goto("/sites/web_quantum_age/editor");
  const quantum = await fontOptions(page);
  expect(quantum).toContain("Figtree");
  expect(quantum).toContain("Source Serif 4");
  expect(quantum).not.toContain("Fraunces");
});
