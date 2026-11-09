import { expect, test } from "@playwright/test";

test("Harbor loads, lists the tide clock, and a blank page is not a Quantum Age hero", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/sites/web_harbor/editor");
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
  await page.screenshot({ path: "docs/builder/demos/harbor-editor.png" });
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const tide = page.getByText("Tide clock", { exact: true });
  await expect(tide).toBeVisible();
  await expect(page.getByText("Contact form", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit for review" })).toHaveCount(0);
  await page.screenshot({ path: "docs/builder/demos/tide-clock.png" });

  await page.getByRole("button", { name: "New page" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a page" });
  await dialog.getByRole("textbox", { name: "Page name" }).fill(`Blank proof ${Date.now()}`);
  await dialog.getByRole("radio", { name: "Blank canvas" }).check();
  await dialog.getByRole("button", { name: "Create page" }).click();
  await expect(dialog).toHaveCount(0);
  const html = await page.content();
  expect(html).not.toContain("quantum-age.hero");
  await page.screenshot({ path: "docs/builder/demos/blank-page.png" });
});
