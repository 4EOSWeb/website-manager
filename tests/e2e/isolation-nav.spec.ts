import { expect, test, type Page } from "@playwright/test";

async function headerLabels(page: Page) {
  const frame = page.frameLocator("#site-preview");
  const links = frame.locator("header [data-nav-route], nav [data-nav-route]");
  await expect(links.first()).toBeVisible({ timeout: 30_000 });
  return links.allTextContents();
}

test("a Harbor menu edit leaves the Quantum Age header unchanged", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/sites/web_quantum_age/editor");
  const before = await headerLabels(page);
  expect(before.join(" ")).toContain("Approach");
  expect(before.join(" ")).not.toContain("Berth");

  await page.goto("/sites/web_harbor/editor");
  const side = page.locator(".ed-side");
  await side.getByRole("button", { name: "Work", exact: true }).click();
  await side.getByRole("button", { name: "Work settings" }).click();
  const menu = page.getByRole("textbox", { name: "Menu label", exact: true });
  await expect(menu).toBeVisible();
  const save = page.waitForResponse((response) => response.url().includes("/api/sites/web_harbor/draft") && response.request().method() === "PUT");
  await menu.fill("Berth");
  expect((await save).ok()).toBeTruthy();
  await expect(menu).toHaveValue("Berth");

  await page.goto("/sites/web_quantum_age/editor");
  const after = await headerLabels(page);
  expect(after).toEqual(before);

  await page.goto("/sites/web_harbor/editor");
  await page.locator(".ed-side").getByRole("button", { name: "Work", exact: true }).click();
  await page.locator(".ed-side").getByRole("button", { name: "Work settings" }).click();
  const restored = page.getByRole("textbox", { name: "Menu label", exact: true });
  await expect(restored).toHaveValue("Berth");
  const revert = page.waitForResponse((response) => response.url().includes("/api/sites/web_harbor/draft") && response.request().method() === "PUT");
  await restored.fill("");
  expect((await revert).ok()).toBeTruthy();
});
