import { expect, test } from "@playwright/test";
import { afterReload, clearMessages, hubRedo, hubUndo, inspector, messages, openEditor, previewFrame, realErrors, sectionIds, startEditing } from "./helpers";

const moves = (list: { type?: string }[]) => list.filter((item) => item.type === "4eos-move" || item.type === "4eos-reorder-block" || item.type === "4eos-place");

test.describe("selecting and dragging", () => {
  test("the editor opens without console errors and shows the page settings", async ({ page }) => {
    const errors: string[] = [];
    await openEditor(page, errors);
    await expect(inspector(page).getByRole("heading", { name: "Home" })).toBeVisible();
    await expect(inspector(page).getByRole("tab", { name: "Page" })).toBeVisible();
    expect(realErrors(errors)).toEqual([]);
  });

  test("a click selects without moving anything", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    await clearMessages(page);
    await canvas.locator('[data-section-id="who"] [data-field="text"]').first().click();
    await expect(inspector(page).getByRole("tab", { name: "Content" })).toBeVisible();
    expect(moves(await messages(page))).toEqual([]);
    expect(await sectionIds(page)).toEqual(before);
  });

  test("dragging across text selects the words instead of moving the section", async ({ page }) => {
    const canvas = await openEditor(page);
    const paragraph = canvas.locator('[data-section-id="who"] [data-rich="true"]').filter({ hasText: "mobilizes" });
    await paragraph.click();
    await clearMessages(page);
    const box = (await paragraph.boundingBox())!;
    await page.mouse.move(box.x + 4, box.y + 6);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + 6, { steps: 6 });
    await page.mouse.up();
    const selected = await previewFrame(page).evaluate(() => window.getSelection()?.toString() ?? "");
    expect(selected.length).toBeGreaterThan(3);
    expect(moves(await messages(page))).toEqual([]);
  });

  test("the grip reorders sections, and one undo puts them back", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    const who = canvas.locator('[data-section-id="who"]');
    await who.scrollIntoViewIfNeeded();
    await who.click({ position: { x: 600, y: 12 } });
    const target = (await canvas.locator('[data-section-id="audience"]').boundingBox())!;
    const box = (await canvas.locator(".eos-bar .eos-grip").boundingBox())!;
    const after = await afterReload(page, async () => {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      const goal = target.y + 10;
      for (let step = 1; step <= 12; step += 1) await page.mouse.move(box.x + 10, box.y + ((goal - box.y) * step) / 12);
      await page.mouse.up();
    }).then(() => sectionIds(page));
    expect(after.indexOf("who")).toBe(before.indexOf("audience"));
    expect(after.filter((id) => id !== "who")).toEqual(before.filter((id) => id !== "who"));
    await afterReload(page, () => hubUndo(page));
    expect(await sectionIds(page)).toEqual(before);
    await afterReload(page, () => hubRedo(page));
    expect(await sectionIds(page)).toEqual(after);
    await afterReload(page, () => hubUndo(page));
  });

  test("Escape cancels a drag and posts nothing", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    await canvas.locator('[data-section-id="audience"]').click({ position: { x: 600, y: 12 } });
    const box = (await canvas.locator(".eos-bar .eos-grip").boundingBox())!;
    await clearMessages(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let step = 1; step <= 8; step += 1) await page.mouse.move(box.x + 10, box.y + step * 24);
    await expect(canvas.locator("body.eos-dragging")).toBeAttached();
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(canvas.locator("body.eos-dragging")).toHaveCount(0);
    expect(moves(await messages(page))).toEqual([]);
    expect(await sectionIds(page)).toEqual(before);
  });

  test("Escape first ends typing, then clears the selection", async ({ page }) => {
    const canvas = await openEditor(page);
    const heading = canvas.locator('[data-section-id="who"] h2[data-field="text"], [data-section-id="who"] [data-kind="heading"] [data-field="text"]').first();
    await startEditing(heading);
    await page.keyboard.press("Escape");
    await expect(heading).not.toHaveAttribute("contenteditable", "true");
    await expect(canvas.locator(".eos-selected")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(canvas.locator(".eos-selected")).toHaveCount(0);
    await expect(inspector(page).getByRole("heading", { name: "Home" })).toBeVisible();
  });

  test("Delete is ignored while typing", async ({ page }) => {
    const canvas = await openEditor(page);
    const before = await sectionIds(page);
    const paragraph = canvas.locator('[data-section-id="who"] [data-rich="true"]').filter({ hasText: "mobilizes" });
    await startEditing(paragraph);
    await clearMessages(page);
    await page.keyboard.press("Delete");
    await page.keyboard.press("Backspace");
    expect((await messages(page)).filter((item) => item.type === "4eos-action")).toEqual([]);
    await page.keyboard.press("Control+z");
    await page.keyboard.press("Escape");
    expect(await sectionIds(page)).toEqual(before);
  });

  test("choosing a layer selects it on the page", async ({ page }) => {
    const canvas = await openEditor(page);
    await page.getByRole("button", { name: "Layers" }).click();
    await page.getByRole("tree", { name: "Page layers" }).getByRole("button", { name: /Who we are/ }).first().click();
    await expect(canvas.locator('[data-section-id="who"].eos-selected')).toBeAttached();
    await expect(inspector(page).getByRole("heading", { name: "Who we are" })).toBeVisible();
  });

  test("the getting started tip stays dismissed", async ({ page }) => {
    await openEditor(page);
    await page.evaluate(() => window.localStorage.removeItem("4eos-editor-tip-dismissed"));
    await page.reload();
    const tip = page.getByRole("note");
    await expect(tip).toContainText("Getting started");
    await tip.getByRole("button", { name: "Dismiss tip" }).click();
    await page.reload();
    await expect(page.getByRole("navigation", { name: "Editor panels" })).toBeVisible();
    await expect(page.getByRole("note")).toHaveCount(0);
  });

  for (const width of [1280, 1440, 1920]) {
    test(`no horizontal scroll at ${width} pixels with both panels open`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openEditor(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const frame = page.locator(".ed-frame");
      const stage = page.locator(".ed-canvas");
      const [frameBox, stageBox] = [await frame.boundingBox(), await stage.boundingBox()];
      expect(frameBox!.width).toBeLessThanOrEqual(stageBox!.width);
    });
  }
});
