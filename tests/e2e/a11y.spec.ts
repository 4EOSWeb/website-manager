import { expect, test } from "@playwright/test";
import { openEditor, previewFrame, restoreSnapshot } from "./helpers";

test.describe("accessibility", () => {
  test.beforeEach(restoreSnapshot);

  test("the account menu opens, moves, and closes from the keyboard", async ({ page }) => {
    await openEditor(page);
    const account = page.getByRole("button", { name: /Account:/ });
    await account.focus();
    await page.keyboard.press("Enter");
    await expect(account).toHaveAttribute("aria-expanded", "true");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(menu.getByRole("menuitem", { name: /Confirm/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(account).toHaveAttribute("aria-expanded", "false");
  });

  test("the selection menu opens from the keyboard and arrow keys move through it", async ({ page }) => {
    const canvas = await openEditor(page);
    const section = canvas.locator('[data-section-id="hero"]');
    await section.scrollIntoViewIfNeeded();
    await section.click({ position: { x: 48, y: 8 } });
    const more = canvas.getByRole("button", { name: "More actions" });
    await more.focus();
    await previewFrame(page).locator("[aria-label='More actions']").press("Enter");
    const menu = canvas.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    const enabled = menu.locator('[role="menuitem"]:not([disabled])');
    await expect(enabled.first()).toBeFocused();
    const nextLabel = (await enabled.nth(1).textContent())?.trim();
    await enabled.first().press("ArrowDown");
    await expect(enabled.nth(1)).toBeFocused();
    expect(nextLabel?.length).toBeGreaterThan(0);
    await enabled.nth(1).press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(more).toBeFocused();
  });

  test("a dialog traps focus and Escape closes it", async ({ page }) => {
    await openEditor(page);
    await page.getByRole("button", { name: "New page" }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Add a page" });
    await expect(dialog.getByRole("textbox", { name: "Page name" })).toBeFocused();
    await dialog.getByRole("button", { name: "Create page" }).focus();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", { name: "Create page" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "New page" })).toBeFocused();
  });

  test("icon buttons have accessible names and a keyboard focus ring", async ({ page }) => {
    await openEditor(page);
    const unlabeled = await page.locator(".ed-topbar button, .ed-rail button").evaluateAll((nodes) =>
      nodes
        .filter((node) => !(node.getAttribute("aria-label") || node.textContent?.trim()))
        .map((node) => node.outerHTML.slice(0, 120)),
    );
    expect(unlabeled).toEqual([]);

    const account = page.getByRole("button", { name: /Account:/ });
    await account.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    const item = page.getByRole("menuitem", { name: /Confirm/ });
    await expect(item).toBeFocused();
    const ring = await item.evaluate((node) => ({
      visible: node.matches(":focus-visible"),
      shadow: getComputedStyle(node).boxShadow,
    }));
    expect(ring.visible).toBe(true);
    expect(ring.shadow).not.toBe("none");
  });

  test("reduced motion shortens editor transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openEditor(page);
    const motion = await page.locator(".ed-root button").first().evaluate((node) => {
      const style = getComputedStyle(node);
      return { transition: style.transitionDuration, animation: style.animationDuration };
    });
    const seconds = (value: string) => (value.endsWith("ms") ? Number.parseFloat(value) / 1000 : Number.parseFloat(value));
    expect(seconds(motion.transition)).toBeLessThan(0.05);
    expect(seconds(motion.animation)).toBeLessThan(0.05);
  });
});
