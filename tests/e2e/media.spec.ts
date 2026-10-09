import { expect, test, type FrameLocator, type Page } from "@playwright/test";
import { afterReload, inspector, openEditor, png, previewFrame, restoreSnapshot, SITE, waitForSaved } from "./helpers";

const SECTION = "who";

async function selectSection(canvas: FrameLocator) {
  const section = canvas.locator(`[data-section-id="${SECTION}"]`);
  await section.scrollIntoViewIfNeeded();
  await section.click({ position: { x: 600, y: 8 } });
  await expect(section).toHaveClass(/eos-selected/);
}

function imageBlocks(page: Page) {
  return previewFrame(page).evaluate(
    (id) => Array.from(document.querySelectorAll(`[data-section-id="${id}"] [data-kind="image"]`)).map((node) => node.getAttribute("data-block-id") ?? ""),
    SECTION,
  );
}

/** Adds an empty Image element to the "Who we are" section and selects it. */
async function addImageBlock(page: Page, canvas: FrameLocator) {
  await selectSection(canvas);
  const before = await imageBlocks(page);
  await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Add" }).click();
  const library = page.locator(".ed-library").first();
  await library.getByRole("textbox", { name: "Search sections and elements" }).fill("image");
  canvas = await afterReload(page, () => library.getByRole("button", { name: "Image", exact: true }).first().click());
  const added = (await imageBlocks(page)).filter((id) => !before.includes(id));
  expect(added).toHaveLength(1);
  const block = canvas.locator(`[data-block-id="${added[0]}"]`);
  await block.scrollIntoViewIfNeeded();
  await block.click();
  await inspector(page).getByRole("tab", { name: "Content" }).click();
  await expect(inspector(page).getByRole("button", { name: "Choose image" })).toBeVisible();
  return { canvas, id: added[0] };
}

async function imageSrc(page: Page, id: string) {
  return previewFrame(page).evaluate((blockId) => document.querySelector(`[data-block-id="${blockId}"] img`)?.getAttribute("src") ?? "", id);
}

async function uploadInPicker(page: Page, name: string, width: number, height: number) {
  const dialog = page.getByRole("dialog", { name: "Choose an image" });
  await expect(dialog).toBeVisible();
  const pictures = dialog.getByRole("button").filter({ hasText: /\.png$/ });
  const before = await pictures.count();
  await dialog.locator('input[type="file"]').setInputFiles({ name, mimeType: "image/png", buffer: png(width, height) });
  await expect(pictures).toHaveCount(before + 1);
  return pictures.first();
}

test.describe("images and media", () => {
  test.beforeEach(restoreSnapshot);

  test("uploading from the Media panel adds the picture with its size", async ({ page }) => {
    await openEditor(page);
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Media" }).click();
    const panel = page.locator(".ed-panel").filter({ has: page.getByRole("heading", { name: "Media" }) });
    const count = async () => Number((await panel.getByRole("button", { name: /^All images/ }).textContent())?.match(/\((\d+)\)/)?.[1] ?? 0);
    const before = await count();
    await panel.locator('input[type="file"]').setInputFiles({ name: "team-photo.png", mimeType: "image/png", buffer: png(9, 6) });
    await expect(panel.getByText("9×6").first()).toBeVisible();
    await expect.poll(count).toBe(before + 1);
  });

  test("choose, replace, alt text, fit, and focal point all reach the page", async ({ page }) => {
    const opened = await openEditor(page);
    const { id } = await addImageBlock(page, opened);

    await inspector(page).getByRole("button", { name: "Choose image" }).click();
    let chosen = await uploadInPicker(page, "first.png", 11, 7);
    let canvas = await afterReload(page, () => chosen.click());
    const first = await imageSrc(page, id);
    expect(first).toMatch(/\.png/);

    await canvas.locator(`[data-block-id="${id}"]`).click();
    await inspector(page).getByRole("button", { name: "Replace" }).click();
    chosen = await uploadInPicker(page, "second.png", 13, 5);
    canvas = await afterReload(page, () => chosen.click());
    const second = await imageSrc(page, id);
    expect(second).toMatch(/\.png/);
    expect(second).not.toBe(first);

    await canvas.locator(`[data-block-id="${id}"]`).click();
    await inspector(page).getByRole("textbox", { name: "Describe the picture" }).fill("Two colleagues reviewing a plan");
    await waitForSaved(page);
    await expect.poll(() => previewFrame(page).evaluate((blockId) => document.querySelector(`[data-block-id="${blockId}"] img`)?.getAttribute("alt"), id)).toBe("Two colleagues reviewing a plan");

    await inspector(page).getByRole("tab", { name: "Layout" }).click();
    canvas = await afterReload(page, () => inspector(page).getByRole("radio", { name: "Fill the space" }).click());
    await canvas.locator(`[data-block-id="${id}"]`).click();
    await inspector(page).getByRole("tab", { name: "Layout" }).click();
    await afterReload(page, () => inspector(page).getByRole("radio", { name: "Top" }).click());
    const styles = await previewFrame(page).evaluate((blockId) => {
      const img = document.querySelector<HTMLImageElement>(`[data-block-id="${blockId}"] img`);
      return img ? { fit: getComputedStyle(img).objectFit, position: img.style.objectPosition } : null;
    }, id);
    expect(styles).toEqual({ fit: "cover", position: "center top" });
  });

  test("cropping saves a new copy and keeps the original in the library", async ({ page }) => {
    const opened = await openEditor(page);
    const { id } = await addImageBlock(page, opened);
    await inspector(page).getByRole("button", { name: "Choose image" }).click();
    const chosen = await uploadInPicker(page, "wide.png", 40, 20);
    const canvas = await afterReload(page, () => chosen.click());
    const original = await imageSrc(page, id);

    await canvas.locator(`[data-block-id="${id}"]`).click();
    await inspector(page).getByRole("button", { name: "Crop" }).click();
    const crop = page.getByRole("dialog", { name: "Crop image" });
    await expect(crop).toBeVisible();
    await crop.getByRole("radio", { name: "Square" }).click();
    await afterReload(page, () => crop.getByRole("button", { name: "Save crop" }).click());
    await expect(crop).toHaveCount(0);
    const cropped = await imageSrc(page, id);
    expect(cropped).not.toBe(original);
    const size = await previewFrame(page).evaluate(async (blockId) => {
      const img = document.querySelector<HTMLImageElement>(`[data-block-id="${blockId}"] img`);
      if (img && !img.complete) await new Promise((resolve) => img.addEventListener("load", resolve, { once: true }));
      return img ? [img.naturalWidth, img.naturalHeight] : null;
    }, id);
    expect(size).toEqual([20, 20]);

    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Media" }).click();
    await expect(page.locator(".ed-media-list").getByText("40×20").first()).toBeVisible();
  });

  test("a picture in use cannot be deleted, and an unused one can", async ({ page }) => {
    const opened = await openEditor(page);
    const { id } = await addImageBlock(page, opened);
    await inspector(page).getByRole("button", { name: "Choose image" }).click();
    const chosen = await uploadInPicker(page, "in-use.png", 15, 9);
    await afterReload(page, () => chosen.click());
    const used = (await imageSrc(page, id)).split("?")[0].split("/").pop() ?? "";

    await page.reload();
    await expect(page.getByRole("navigation", { name: "Editor panels" })).toBeVisible();
    await waitForSaved(page);
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Media" }).click();
    const panel = page.locator(".ed-panel").filter({ has: page.getByRole("heading", { name: "Media" }) });
    const usedTile = panel.locator(".ed-media-tile").filter({ hasText: "15×9" }).first();
    await expect(usedTile).toContainText("Used on");
    await expect(usedTile.getByRole("button", { name: /^Delete/ })).toBeDisabled();

    const refused = await page.request.delete(`/api/sites/${SITE}/media`, { data: { filename: used } });
    expect(refused.ok()).toBe(false);

    await panel.locator('input[type="file"]').setInputFiles({ name: "spare.png", mimeType: "image/png", buffer: png(17, 3) });
    const spare = panel.locator(".ed-media-tile").filter({ hasText: "17×3" }).first();
    await expect(spare).toBeVisible();
    await spare.getByRole("button", { name: /^Delete/ }).click();
    await expect(page.getByText("Image deleted.")).toBeVisible();
    await expect(panel.locator(".ed-media-tile").filter({ hasText: "17×3" })).toHaveCount(0);
  });

  test("dropping a file on an image replaces it, and other files are refused", async ({ page }) => {
    const opened = await openEditor(page);
    const { id } = await addImageBlock(page, opened);
    await inspector(page).getByRole("button", { name: "Choose image" }).click();
    const chosen = await uploadInPicker(page, "before-drop.png", 19, 4);
    await afterReload(page, () => chosen.click());
    const before = await imageSrc(page, id);

    const drop = (name: string, type: string, bytes: number[]) =>
      previewFrame(page).evaluate(
        ({ blockId, name, type, bytes }) => {
          const target = document.querySelector(`[data-block-id="${blockId}"] img`);
          if (!target) throw new Error("No image to drop on");
          const transfer = new DataTransfer();
          transfer.items.add(new File([new Uint8Array(bytes)], name, { type }));
          target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }));
          target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        },
        { blockId: id, name, type, bytes },
      );

    await drop("notes.txt", "text/plain", [104, 105]);
    await expect(page.getByText("notes.txt is not an image this site can use")).toBeVisible();

    await afterReload(page, () => drop("dropped.png", "image/png", [...png(21, 2)]));
    await expect(page.getByText("Image replaced.")).toBeVisible();
    const after = await imageSrc(page, id);
    expect(after).toMatch(/\.png/);
    expect(after).not.toBe(before);
  });
});
