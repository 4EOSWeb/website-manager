import { expect, test, type FrameLocator, type Page } from "@playwright/test";
import { afterReload, openEditor, restoreSnapshot, sectionIds, waitForSaved } from "./helpers";

async function selectSection(canvas: FrameLocator, id: string) {
  const section = canvas.locator(`[data-section-id="${id}"]`);
  await section.scrollIntoViewIfNeeded();
  await section.click({ position: { x: 600, y: 8 } });
  await expect(section).toHaveClass(/eos-selected/);
}

function toolbar(canvas: FrameLocator) {
  return canvas.locator(".eos-bar");
}

async function menuItem(canvas: FrameLocator, name: string | RegExp) {
  await toolbar(canvas).getByRole("button", { name: "More actions" }).click();
  return canvas.getByRole("menu").getByRole("menuitem", { name });
}

function added(before: string[], after: string[]) {
  return after.filter((id) => !before.includes(id));
}

async function idsAfter(page: Page, change: () => Promise<void>) {
  await afterReload(page, change);
  return sectionIds(page);
}

test.describe("page structure", () => {
  test.beforeEach(restoreSnapshot);

  test("the Add section button in a gap inserts at that spot", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    const gap = canvas.locator('.eos-gap[data-before="who"]');
    const hit = gap.locator(".eos-gap-hit");
    await hit.scrollIntoViewIfNeeded();
    await hit.hover();
    await gap.getByRole("button", { name: "Add a section here" }).click();
    const dialog = page.getByRole("dialog", { name: "Add a section here" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("searchbox").or(dialog.getByRole("textbox", { name: "Search sections and elements" }))).toBeFocused();
    const after = await idsAfter(page, () => dialog.getByRole("button", { name: /Feature cards/ }).first().click());
    const fresh = added(before, after);
    expect(fresh).toHaveLength(1);
    expect(after.indexOf(fresh[0])).toBe(before.indexOf("who"));
    expect(after[after.indexOf(fresh[0]) + 1]).toBe("who");
  });

  test("library search and categories narrow the choices", async ({ page }) => {
    await openEditor(page);
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
    const panel = page.locator(".ed-library").first();
    await panel.getByRole("textbox", { name: "Search sections and elements" }).fill("question");
    await expect(panel.getByRole("button", { name: /Questions and answers/ })).toBeVisible();
    await expect(panel.getByRole("button", { name: /^Hero/ })).toHaveCount(0);
    await panel.getByRole("textbox", { name: "Search sections and elements" }).fill("");
    await panel.getByRole("tab", { name: "Testimonials" }).click();
    await expect(panel.getByRole("button", { name: /Testimonial/ })).toBeVisible();
    await expect(panel.getByRole("button", { name: /Paragraph/ })).toHaveCount(0);
  });

  test("Duplicate puts a copy right after the section", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    await selectSection(canvas, "who");
    const after = await idsAfter(page, () => toolbar(canvas).getByRole("button", { name: "Duplicate" }).click());
    const fresh = added(before, after);
    expect(fresh).toHaveLength(1);
    expect(after.indexOf(fresh[0])).toBe(after.indexOf("who") + 1);
  });

  test("Hide marks the section hidden, and Show brings it back", async ({ page }) => {
    const canvas = await openEditor(page);
    await selectSection(canvas, "who");
    await afterReload(page, () => toolbar(canvas).getByRole("button", { name: "Hide from the website" }).click());
    const who = page.frameLocator("#site-preview").locator('[data-section-id="who"]');
    await expect(who).toHaveAttribute("data-hidden", "true");
    await selectSection(page.frameLocator("#site-preview"), "who");
    await afterReload(page, () => toolbar(page.frameLocator("#site-preview")).getByRole("button", { name: "Show on the website" }).click());
    await expect(page.frameLocator("#site-preview").locator('[data-section-id="who"]')).not.toHaveAttribute("data-hidden", "true");
  });

  test("Delete needs no confirmation, and the toast's Undo restores the section", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    await selectSection(canvas, "who");
    const item = await menuItem(canvas, /Delete/);
    const after = await idsAfter(page, () => item.click());
    expect(after).not.toContain("who");
    const toast = page.locator(".ed-toast").filter({ hasText: /deleted/i });
    await expect(toast).toBeVisible();
    const restored = await idsAfter(page, () => toast.getByRole("button", { name: "Undo" }).click());
    expect(restored).toEqual(before);
  });

  test("Alt and the arrow keys move the selected section", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    await selectSection(canvas, "who");
    const after = await idsAfter(page, () => page.keyboard.press("Alt+ArrowUp"));
    expect(after.indexOf("who")).toBe(before.indexOf("who") - 1);
  });

  test("Copy and paste adds the section below the selected one", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    await selectSection(canvas, "who");
    await (await menuItem(canvas, "Copy section")).click();
    await expect(page.locator(".ed-toast").filter({ hasText: /copied/i })).toBeVisible();
    await selectSection(canvas, "formula");
    const paste = await menuItem(canvas, "Paste section below");
    const after = await idsAfter(page, () => paste.click());
    const fresh = added(before, after);
    expect(fresh).toHaveLength(1);
    expect(after.indexOf(fresh[0])).toBe(after.indexOf("formula") + 1);
  });

  test("Save as template, then add the template from the library", async ({ page }) => {
    const canvas = await openEditor(page);
    await selectSection(canvas, "who");
    await (await menuItem(canvas, "Save as template")).click();
    const dialog = page.getByRole("dialog", { name: "Save as a template" });
    await dialog.getByRole("textbox", { name: "Template name" }).fill("Who we are block");
    await dialog.getByRole("button", { name: "Save template" }).click();
    await expect(dialog).toHaveCount(0);
    await waitForSaved(page);
    const before = await sectionIds(page);
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
    const library = page.locator(".ed-library").first();
    await library.getByRole("tab", { name: "Saved" }).click();
    const after = await idsAfter(page, () => library.getByRole("button", { name: /Who we are block/ }).click());
    expect(added(before, after)).toHaveLength(1);
  });

  test("with a section selected, Add puts an element inside it", async ({ page }) => {
    const canvas = await openEditor(page);
    await selectSection(canvas, "who");
    const count = await canvas.locator('[data-section-id="who"] [data-block-id]').count();
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
    const library = page.locator(".ed-library").first();
    await expect(library.getByRole("heading", { name: "Recommended here" })).toBeVisible();
    await afterReload(page, () => library.getByRole("button", { name: /^Button/ }).first().click());
    await expect(page.frameLocator("#site-preview").locator('[data-section-id="who"] [data-block-id]')).toHaveCount(count + 1);
  });
});
