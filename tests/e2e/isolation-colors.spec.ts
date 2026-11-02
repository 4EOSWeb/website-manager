import { expect, test } from "@playwright/test";

test("Harbor color tokens are Harbor's palette", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/sites/web_harbor/editor");
  await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
  const library = page.locator(".ed-library").first();
  await library.getByRole("textbox", { name: "Search sections and elements" }).fill("button");
  await library.getByRole("button", { name: "Button", exact: true }).first().click();
  const select = page.getByRole("combobox", { name: "Color token" });
  await expect(select).toBeVisible();
  const options = await select.locator("option").allTextContents();
  expect(options).toEqual(expect.arrayContaining(["sea", "sand", "coral", "foam"]));
  expect(options).not.toContain("plum");
  expect(options).not.toContain("ink");

  await page.goto("/sites/web_quantum_age/editor");
  await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
  const quantumLibrary = page.locator(".ed-library").first();
  await quantumLibrary.getByRole("textbox", { name: "Search sections and elements" }).fill("button");
  await quantumLibrary.getByRole("button", { name: "Button", exact: true }).first().click();
  const quantumSelect = page.getByRole("combobox", { name: "Color token" });
  await expect(quantumSelect).toBeVisible();
  const quantumOptions = await quantumSelect.locator("option").allTextContents();
  expect(quantumOptions).toContain("plum");
  expect(quantumOptions).not.toContain("sea");
});
