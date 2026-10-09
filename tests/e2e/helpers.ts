import zlib from "node:zlib";
import { expect, type Frame, type FrameLocator, type Locator, type Page } from "@playwright/test";

export const SITE = "web_quantum_age";

/** Next.js dev tooling reads document.cookie, which a sandboxed preview frame cannot do. Production builds do not log this. */
const DEV_ONLY = [/document is sandboxed and lacks the 'allow-same-origin' flag/];

export function realErrors(errors: string[]) {
  return errors.filter((text) => !DEV_ONLY.some((pattern) => pattern.test(text)));
}

type Recorded = { type?: string; [key: string]: unknown };

export async function openEditor(page: Page, errors: string[] = []) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    if (window.top !== window) return;
    const store = window as unknown as { __messages: unknown[] };
    store.__messages = [];
    window.addEventListener("message", (event) => store.__messages.push(event.data));
  });
  await page.goto(`/sites/${SITE}/editor`);
  await expect(page.getByRole("navigation", { name: "Editor panels" })).toBeVisible();
  const canvas = await readyCanvas(page);
  await waitForSaved(page);
  return canvas;
}

export async function readyCanvas(page: Page) {
  const canvas = page.frameLocator("#site-preview");
  await expect(canvas.locator(".eos-gap").first()).toBeAttached({ timeout: 60_000 });
  return canvas;
}

export async function waitForSaved(page: Page) {
  await expect(page.locator(".ed-save")).toHaveText(/Saved/, { timeout: 20_000 });
}

export function previewFrame(page: Page): Frame {
  const frame = page.frames().find((item) => item.url().includes("/preview/"));
  if (!frame) throw new Error("The preview frame is missing");
  return frame;
}

/** Marks the current preview document so a later reload can be detected. */
export async function markFrame(page: Page) {
  await previewFrame(page).evaluate(() => {
    (window as unknown as { __eosMark: boolean }).__eosMark = true;
  });
}

export async function waitForFrameReload(page: Page) {
  await expect
    .poll(
      async () => {
        try {
          return await previewFrame(page).evaluate(() => Boolean((window as unknown as { __eosMark?: boolean }).__eosMark));
        } catch {
          return true;
        }
      },
      { timeout: 30_000 },
    )
    .toBe(false);
  return readyCanvas(page);
}

/** Runs a change that reloads the preview, and waits for the save and the reload. */
export async function afterReload(page: Page, change: () => Promise<void>) {
  await markFrame(page);
  await change();
  await waitForSaved(page);
  return waitForFrameReload(page);
}

export async function messages(page: Page): Promise<Recorded[]> {
  return page.evaluate(() => (window as unknown as { __messages: Recorded[] }).__messages.slice());
}

export async function clearMessages(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __messages: unknown[] }).__messages.length = 0;
  });
}

export function sections(canvas: FrameLocator) {
  return canvas.locator("[data-section-id]:not([data-section-id] [data-section-id])");
}

export async function sectionIds(page: Page) {
  return previewFrame(page).evaluate(() =>
    Array.from(document.querySelectorAll("[data-section-id]"))
      .filter((node) => !node.parentElement?.closest("[data-section-id]"))
      .map((node) => node.getAttribute("data-section-id") ?? ""),
  );
}

export function inspector(page: Page) {
  return page.getByRole("complementary", { name: "Properties" });
}

export async function hubUndo(page: Page) {
  await page.locator(".ed-status").click();
  await page.keyboard.press("Control+z");
}

export async function hubRedo(page: Page) {
  await page.locator(".ed-status").click();
  await page.keyboard.press("Control+Shift+z");
}

export async function startEditing(field: Locator) {
  await field.dblclick();
  await expect(field).toHaveAttribute("contenteditable", "true");
}

/** Selects characters [start, end) of the field's text inside the preview frame. */
export async function selectRange(page: Page, selector: string, start: number, end: number) {
  await previewFrame(page).evaluate(
    ({ selector, start, end }) => {
      const field = document.querySelector(selector);
      if (!field) throw new Error(`No field for ${selector}`);
      const walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let seen = 0;
      let startSet = false;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const length = node.textContent?.length ?? 0;
        if (!startSet && start <= seen + length) {
          range.setStart(node, start - seen);
          startSet = true;
        }
        if (startSet && end <= seen + length) {
          range.setEnd(node, end - seen);
          break;
        }
        seen += length;
      }
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    },
    { selector, start, end },
  );
}

export function png(width = 4, height = 3) {
  const header = Buffer.from("89504e470d0a1a0a", "hex");
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([length, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = y * (width * 3 + 1) + 1 + x * 3;
      rows[at] = 40 + x * 40;
      rows[at + 1] = 90;
      rows[at + 2] = 160 + y * 20;
    }
  }
  return Buffer.concat([header, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}

function crc32(buffer: Buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return crc ^ -1;
}
