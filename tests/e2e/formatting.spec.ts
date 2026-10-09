import { expect, test, type Page, type Request } from "@playwright/test";
import { afterReload, hubRedo, hubUndo, openEditor, previewFrame, readyCanvas, realErrors, restoreSnapshot, selectRange, startEditing, waitForSaved } from "./helpers";

const BLOCK = "blk_who_p";
const FIELD = `[data-block-id="${BLOCK}"] [data-field="text"]`;
const WORDS = "Quantum Age";
const ORIGINAL = "Quantum Age Collaborative mobilizes leading experts to help healthcare organizations focused on growth achieve their goals.";

type Mark = { start: number; end: number; kind: string; href?: string; color?: string };

function savedMarks(request: Request): Mark[] {
  const site = request.postDataJSON() as { pages: { route: string; sections: { blocks?: { id: string; text?: { text: string; marks?: Mark[] } }[] }[] }[] };
  const home = site.pages.find((page) => page.route === "/");
  const block = home?.sections.flatMap((section) => section.blocks ?? []).find((item) => item.id === BLOCK);
  if (!block?.text) throw new Error("The saved draft is missing the paragraph");
  expect(block.text.text).toBe(ORIGINAL);
  return block.text.marks ?? [];
}

function draftSave(page: Page) {
  return page.waitForRequest((request) => request.method() === "PUT" && request.url().includes("/draft"));
}

async function fieldHtml(page: Page) {
  return previewFrame(page).evaluate((selector) => document.querySelector(selector)?.innerHTML ?? "", FIELD);
}

/** The stored markup may only use the renderer's own tags, with no leftovers from contenteditable. */
function assertClean(html: string) {
  expect(html).not.toMatch(/<(b|i|font|div|br)\b/);
  expect(html).not.toContain("&nbsp;");
  expect(html).not.toMatch(/<(strong|em|u|a|span)[^>]*><\/\1>/);
  expect(html).not.toMatch(/style="(?!color:)/);
}

async function openPublicPreview(page: Page) {
  const src = await page.locator("#site-preview").getAttribute("src");
  const preview = await page.context().newPage();
  await preview.goto(`${src}&clean=1`);
  return preview;
}

type Control = {
  name: string;
  apply: (page: Page) => Promise<void>;
  mark: Partial<Mark>;
  selector: string;
};

const fmt = (page: Page, act: string) => page.frameLocator("#site-preview").locator(`.eos-fmt [data-act="${act}"]`).click();

const CONTROLS: Control[] = [
  { name: "Bold", apply: (page) => fmt(page, "fmt-bold"), mark: { kind: "bold" }, selector: "strong" },
  { name: "Italic", apply: (page) => fmt(page, "fmt-italic"), mark: { kind: "italic" }, selector: "em" },
  { name: "Underline", apply: (page) => fmt(page, "fmt-underline"), mark: { kind: "underline" }, selector: "u" },
  {
    name: "Link",
    apply: async (page) => {
      await fmt(page, "fmt-link");
      const input = page.frameLocator("#site-preview").getByRole("textbox", { name: "Link address" });
      await input.fill("/contact");
      await input.press("Enter");
    },
    mark: { kind: "link", href: "/contact" },
    selector: 'a[href*="/contact"]',
  },
  {
    name: "Color",
    apply: async (page) => {
      await fmt(page, "fmt-color");
      await page.frameLocator("#site-preview").locator(".eos-swatch").first().click();
    },
    mark: { kind: "color" },
    selector: "span[data-color]",
  },
  { name: "Ctrl+B", apply: (page) => page.keyboard.press("Control+b"), mark: { kind: "bold" }, selector: "strong" },
];

test.describe("text formatting", () => {
  test.beforeEach(restoreSnapshot);

  for (const control of CONTROLS) {
    test(`${control.name}: applies, saves, survives a reload, matches the preview, and undoes`, async ({ page }) => {
      const errors: string[] = [];
      const canvas = await openEditor(page, errors);
      const field = canvas.locator(FIELD);
      await field.scrollIntoViewIfNeeded();
      await startEditing(field);
      await selectRange(page, FIELD, 0, WORDS.length);
      await control.apply(page);
      await expect(field.locator(control.selector)).toHaveText(WORDS);

      const saved = draftSave(page);
      await page.keyboard.press("Escape");
      await expect(field).not.toHaveAttribute("contenteditable", "true");
      expect(savedMarks(await saved)).toEqual([expect.objectContaining({ start: 0, end: WORDS.length, ...control.mark })]);
      await waitForSaved(page);

      const frame = page.frameLocator("#site-preview");
      await afterReload(page, () => hubUndo(page));
      await expect(frame.locator(`${FIELD} ${control.selector}`)).toHaveCount(0);
      await afterReload(page, () => hubRedo(page));
      await expect(frame.locator(`${FIELD} ${control.selector}`)).toHaveText(WORDS);

      await page.reload();
      const reloaded = await readyCanvas(page);
      await expect(reloaded.locator(`${FIELD} ${control.selector}`)).toHaveText(WORDS);
      assertClean(await fieldHtml(page));

      const preview = await openPublicPreview(page);
      await expect(preview.locator(`${FIELD} ${control.selector}`)).toHaveText(WORDS);
      await expect(preview.locator(FIELD)).toHaveText(ORIGINAL);
      await expect(preview.locator(".eos-ui, .eos-gap")).toHaveCount(0);
      await preview.close();
      expect(realErrors(errors)).toEqual([]);
    });
  }

  test("pressing a control twice turns it off again", async ({ page }) => {
    const canvas = await openEditor(page);
    const field = canvas.locator(FIELD);
    await field.scrollIntoViewIfNeeded();
    await startEditing(field);
    await selectRange(page, FIELD, 0, WORDS.length);
    await fmt(page, "fmt-bold");
    await expect(canvas.locator('.eos-fmt [data-act="fmt-bold"]')).toHaveAttribute("aria-pressed", "true");
    await selectRange(page, FIELD, 0, WORDS.length);
    await fmt(page, "fmt-bold");
    await expect(field.locator("strong")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await waitForSaved(page);
  });

  test("Clear formatting removes every mark in the selection", async ({ page }) => {
    const canvas = await openEditor(page);
    const field = canvas.locator(FIELD);
    await field.scrollIntoViewIfNeeded();
    await startEditing(field);
    await selectRange(page, FIELD, 0, WORDS.length);
    await fmt(page, "fmt-bold");
    await selectRange(page, FIELD, 0, WORDS.length);
    await fmt(page, "fmt-italic");
    await expect(field.locator("strong em, em strong")).toHaveText(WORDS);
    await selectRange(page, FIELD, 0, WORDS.length);
    await fmt(page, "fmt-clear");
    await expect(field.locator("strong, em")).toHaveCount(0);
    expect(await fieldHtml(page)).not.toMatch(/<(strong|em)/);
    await page.keyboard.press("Escape");
    await waitForSaved(page);
    await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  test("Remove link takes the whole link away", async ({ page }) => {
    const canvas = await openEditor(page);
    const field = canvas.locator(FIELD);
    await field.scrollIntoViewIfNeeded();
    await startEditing(field);
    await selectRange(page, FIELD, 0, WORDS.length);
    await CONTROLS[3].apply(page);
    await expect(field.locator("a")).toHaveText(WORDS);
    await selectRange(page, FIELD, 2, 4);
    await expect(canvas.locator('.eos-fmt [data-act="fmt-unlink"]')).toBeEnabled();
    await fmt(page, "fmt-unlink");
    await expect(field.locator("a")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await waitForSaved(page);
  });

  test("an unsafe link is refused with a clear note", async ({ page }) => {
    const canvas = await openEditor(page);
    const field = canvas.locator(FIELD);
    await field.scrollIntoViewIfNeeded();
    await startEditing(field);
    await selectRange(page, FIELD, 0, WORDS.length);
    await fmt(page, "fmt-link");
    const input = canvas.getByRole("textbox", { name: "Link address" });
    await input.fill("javascript:alert(1)");
    await input.press("Enter");
    await expect(canvas.locator(".eos-fmt .eos-note")).toHaveText(/Use a page path like \/contact/);
    await expect(field.locator("a")).toHaveCount(0);
    await input.press("Escape");
    await expect(canvas.locator('.eos-fmt [data-act="fmt-bold"]')).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("formatting with nothing selected asks for a selection", async ({ page }) => {
    const canvas = await openEditor(page);
    const field = canvas.locator(FIELD);
    await field.scrollIntoViewIfNeeded();
    await startEditing(field);
    await selectRange(page, FIELD, 3, 3);
    await fmt(page, "fmt-bold");
    await expect(canvas.getByText("Select some words first")).toBeVisible();
    await expect(field.locator("strong")).toHaveCount(0);
    await page.keyboard.press("Escape");
  });

  test("pasting formatted text inserts plain text", async ({ page }) => {
    const canvas = await openEditor(page);
    const field = canvas.locator(FIELD);
    await field.scrollIntoViewIfNeeded();
    await startEditing(field);
    await selectRange(page, FIELD, ORIGINAL.length, ORIGINAL.length);
    await previewFrame(page).evaluate((selector) => {
      const data = new DataTransfer();
      data.setData("text/html", "<b style='color:red'>Loud</b> <script>alert(1)</script>");
      data.setData("text/plain", " Pasted words");
      document.querySelector(selector)?.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    }, FIELD);
    await expect(field).toHaveText(`${ORIGINAL} Pasted words`);
    expect(await fieldHtml(page)).not.toMatch(/<b[\s>]|script|style=/);
    const saved = draftSave(page);
    await page.keyboard.press("Escape");
    const request = await saved;
    expect(JSON.stringify(request.postDataJSON())).toContain(`${ORIGINAL} Pasted words`);
    await waitForSaved(page);
    await afterReload(page, () => hubUndo(page));
    await expect(page.frameLocator("#site-preview").locator(FIELD)).toHaveText(ORIGINAL);
  });

  test("Enter finishes a heading, and adds a line break in a paragraph", async ({ page }) => {
    const canvas = await openEditor(page);
    const heading = canvas.locator('[data-block-id="blk_who_h"] [data-field="text"]');
    await heading.scrollIntoViewIfNeeded();
    await startEditing(heading);
    await page.keyboard.press("Enter");
    await expect(heading).not.toHaveAttribute("contenteditable", "true");

    const field = canvas.locator(FIELD);
    await startEditing(field);
    await selectRange(page, FIELD, WORDS.length, WORDS.length);
    await page.keyboard.press("Enter");
    await expect(field).toHaveAttribute("contenteditable", "true");
    const text = await previewFrame(page).evaluate((selector) => document.querySelector(selector)?.textContent ?? "", FIELD);
    expect(text.startsWith(`${WORDS}\n`)).toBe(true);
    await page.keyboard.press("Escape");
    await waitForSaved(page);
    await afterReload(page, () => hubUndo(page));
    await expect(page.frameLocator("#site-preview").locator(FIELD)).toHaveText(ORIGINAL);
  });
});
