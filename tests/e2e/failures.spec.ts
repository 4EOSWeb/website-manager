import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { inspector, openEditor, previewFrame, restoreSnapshot, SITE, waitForSaved } from "./helpers";

const DRAFT = `/api/sites/${SITE}/draft`;
const MEDIA = `/api/sites/${SITE}/media`;
const PUBLISH = `/api/sites/${SITE}/publish`;

test.describe("failures", () => {
  test.beforeEach(restoreSnapshot);

  test("a failed save shows an error and Retry writes it", async ({ page }) => {
    await openEditor(page);
    let fail = true;
    await page.route(DRAFT, async (route) => {
      if (fail && route.request().method() === "PUT") {
        await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "The draft could not be saved." }) });
        return;
      }
      await route.continue();
    });
    await inspector(page).getByRole("textbox", { name: "Page name" }).fill("Home revised");
    await expect(page.getByRole("alert").filter({ hasText: "The draft could not be saved." })).toBeVisible();
    await expect(page.locator(".ed-save")).toContainText("Not saved");
    fail = false;
    await page.locator(".ed-save").getByRole("button", { name: "Retry" }).click();
    await waitForSaved(page);
  });

  test("a failed upload is reported", async ({ page }) => {
    await openEditor(page);
    await page.route(MEDIA, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "The image could not be added." }) });
        return;
      }
      await route.continue();
    });
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Media" }).click();
    const panel = page.locator(".ed-panel").filter({ has: page.getByRole("heading", { name: "Media" }) });
    await panel.locator('input[type="file"]').setInputFiles({ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not-really") });
    await expect(page.getByRole("alert").filter({ hasText: "The image could not be added." })).toBeVisible();
  });

  test("an unsupported file is refused", async ({ page }) => {
    await openEditor(page);
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Media" }).click();
    const panel = page.locator(".ed-panel").filter({ has: page.getByRole("heading", { name: "Media" }) });
    await panel.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.getByRole("alert").filter({ hasText: "Use a PNG, JPEG, WebP, or SVG image." })).toBeVisible();
  });

  test("an insecure link is rejected and is not saved", async ({ page }) => {
    const canvas = await openEditor(page);
    const button = canvas.locator('[data-block-id="blk_talk"]');
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await inspector(page).getByRole("tab", { name: "Content" }).click();
    await inspector(page).getByRole("combobox", { name: "Link to" }).selectOption("__custom");
    const address = inspector(page).getByRole("textbox", { name: "Address" });
    await address.fill("http://example.com");
    await expect(inspector(page).getByText("Use the secure https:// version")).toBeVisible();
    await address.fill("not a link");
    await expect(inspector(page).getByText("Use a page path like /contact")).toBeVisible();
    const href = await previewFrame(page).evaluate(() => document.querySelector('[data-block-id="blk_talk"] a')?.getAttribute("href") ?? "");
    expect(href).toContain("/contact");
    expect(href).not.toMatch(/example\.com|not a link/);
  });

  test("going offline keeps the change and says it was not saved", async ({ page, context }) => {
    await openEditor(page);
    try {
      await context.setOffline(true);
      await inspector(page).getByRole("textbox", { name: "Page name" }).fill("Offline edit");
      await expect(page.getByRole("alert").filter({ hasText: "Check your connection" })).toBeVisible();
      await expect(page.locator(".ed-save")).toContainText("Not saved");
      await expect(inspector(page).getByRole("textbox", { name: "Page name" })).toHaveValue("Offline edit");
    } finally {
      await context.setOffline(false);
    }
  });

  test("an older copy of the draft overwrites a newer one", async ({ page }) => {
    // The draft API has no version or updated-at check, so a stale save is accepted.
    await openEditor(page);
    const site = JSON.parse(fs.readFileSync(".workspaces/web_quantum_age/src/content/editor/site.json", "utf8")) as { pages: { seoTitle: string }[] };
    const newer = structuredClone(site);
    newer.pages[0].seoTitle = "Newer title";
    const older = structuredClone(site);
    older.pages[0].seoTitle = "Older title";
    expect((await page.request.put(DRAFT, { data: newer })).ok()).toBe(true);
    const stale = await page.request.put(DRAFT, { data: older });
    expect(stale.status()).not.toBe(409);
    expect(stale.ok()).toBe(true);
  });

  test("leaving with unsaved changes is blocked", async ({ page }) => {
    await openEditor(page);
    await page.route(DRAFT, async (route) => {
      if (route.request().method() === "PUT") await new Promise((resolve) => setTimeout(resolve, 5_000));
      await route.continue();
    });
    await inspector(page).getByRole("textbox", { name: "Page name" }).fill("Still typing");
    await expect(page.locator(".ed-save")).toContainText(/Unsaved|Saving/);
    const blocked = await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(blocked).toBe(true);
  });

  test("a failed review explains what happened", async ({ page }) => {
    await openEditor(page);
    await page.route(PUBLISH, async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "The review could not be opened." }) });
    });
    await page.getByRole("button", { name: "Submit for review" }).click();
    const review = page.getByRole("dialog", { name: "Send changes for review" });
    await review.getByRole("button", { name: "Send for review" }).click();
    await expect(review.getByRole("status")).toHaveText("The review could not be opened.");
  });
});
