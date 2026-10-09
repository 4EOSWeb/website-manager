import { expect, test, type Page } from "@playwright/test";
import { inspector, openEditor, readyCanvas, restoreSnapshot, waitForSaved } from "./helpers";

/** Waits until a change leaves the saved state and comes back, so a fast check cannot pass early. */
async function settle(page: Page) {
  await expect(page.locator(".ed-save")).toHaveText(/Unsaved|Saving|Not saved/, { timeout: 5_000 });
  await waitForSaved(page);
}

async function createPage(page: Page, title: string) {
  await page.getByRole("button", { name: "New page" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a page" });
  await dialog.getByRole("textbox", { name: "Page name" }).fill(title);
  await dialog.getByRole("textbox", { name: "Title in search results" }).fill(`${title} for teams`);
  await dialog.getByRole("textbox", { name: "Search description" }).fill("A plain description of what this page covers.");
  await dialog.getByRole("button", { name: "Create page" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("alert").or(page.getByRole("status")).filter({ hasText: `${title} is ready` })).toBeVisible();
  await waitForSaved(page);
  await readyCanvas(page);
}

test.describe("pages", () => {
  test.beforeEach(restoreSnapshot);

  test("a built-in page keeps its address", async ({ page }) => {
    await openEditor(page);
    const address = inspector(page).getByRole("textbox", { name: "Web address" });
    await expect(address).toBeDisabled();
    await expect(address).toHaveValue("/");
    await expect(inspector(page).getByText("Built-in pages keep their address.")).toBeVisible();
  });

  test("create, rename, address, menu, search details, preview, and submit", async ({ page }) => {
    test.setTimeout(240_000);
    await openEditor(page);
    await createPage(page, "Workshop notes");

    await expect(inspector(page).getByRole("heading", { name: "Workshop notes" })).toBeVisible();
    await inspector(page).getByRole("tab", { name: "Search" }).click();
    await expect(inspector(page).getByRole("textbox", { name: "Title" })).toHaveValue("Workshop notes for teams");
    await expect(inspector(page).getByRole("textbox", { name: "Description" })).toHaveValue("A plain description of what this page covers.");
    await expect(inspector(page).locator(".ed-serp-title")).toHaveText("Workshop notes for teams");
    await inspector(page).getByRole("textbox", { name: "Description" }).fill("How a workshop with the team actually runs.");
    await expect(inspector(page).locator(".ed-serp-desc")).toHaveText("How a workshop with the team actually runs.");
    await settle(page);

    await inspector(page).getByRole("tab", { name: "Page" }).click();
    await inspector(page).getByRole("textbox", { name: "Page name" }).fill("Workshop notes updated");
    await settle(page);
    await expect(page.getByRole("button", { name: /Current page: Workshop notes updated/ })).toBeVisible();

    const address = inspector(page).getByRole("textbox", { name: "Web address" });
    await expect(address).toHaveValue("/workshop-notes");
    await address.fill("Not a slug");
    await address.press("Enter");
    await expect(inspector(page).getByText("Use a short address")).toBeVisible();
    await address.fill("about");
    await address.press("Enter");
    await expect(inspector(page).getByText("That address is already used.")).toBeVisible();
    await address.fill("workshop-notes-2026");
    await address.press("Enter");
    await expect(page.getByText("This page now lives at /workshop-notes-2026.")).toBeVisible();
    await waitForSaved(page);
    await readyCanvas(page);
    await expect(inspector(page).getByRole("textbox", { name: "Web address" })).toHaveValue("/workshop-notes-2026");

    await inspector(page).getByText("Show in the site menu", { exact: true }).click();
    await expect(inspector(page).getByRole("switch", { name: "Show in the site menu" })).not.toBeChecked();
    await settle(page);
    const hidden = page.locator(".ed-panel").locator(".ed-group").filter({ has: page.getByRole("button", { name: "Not in the menu", exact: true }) });
    await expect(hidden.getByRole("button", { name: "Workshop notes updated" }).first()).toBeVisible();

    const previewLink = page.getByRole("link", { name: "Preview", exact: true });
    const previewHref = await previewLink.getAttribute("href");
    expect(previewHref).toContain("/workshop-notes-2026");
    expect(previewHref).toContain("clean=1");
    const popup = page.waitForEvent("popup");
    await previewLink.click();
    const preview = await popup;
    await preview.waitForLoadState("domcontentloaded");
    expect(preview.url()).toContain("clean=1");
    await expect(preview.locator("body")).toBeVisible();
    await preview.close();

    await page.getByRole("button", { name: "Submit for review" }).click();
    const review = page.getByRole("dialog", { name: "Send changes for review" });
    await expect(review.getByRole("listitem").filter({ hasText: "Workshop notes updated" }).first()).toBeVisible();
    await review.getByRole("button", { name: /Confirm/ }).click();
    await expect(review.getByRole("status")).toContainText(/confirmed/i);
    await review.getByRole("button", { name: "Send for review" }).click();
    await expect(review.getByRole("status")).toContainText(/unchanged|saved|review|GitHub/i, { timeout: 90_000 });
  });
});
