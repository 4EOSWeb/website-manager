import { expect, test, type Page } from "@playwright/test";

const consoleErrors: string[] = [];
const hydration: string[] = [];

function watch(page: Page) {
  page.on("console", (message) => {
    const text = message.text();
    if (/hydration|did not match/i.test(text)) hydration.push(text);
    if (message.type() === "error" && !/Failed to load resource/i.test(text)) consoleErrors.push(text);
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    consoleErrors.push(`${response.status()} ${response.url()}`);
  });
}

async function overflowDelta(page: Page) {
  return page.evaluate(() => {
    const delta = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    let widest = "";
    if (delta > 1) {
      const nodes = Array.from(document.body.querySelectorAll("*"));
      const wide = nodes
        .map((node) => ({ node, width: (node as HTMLElement).offsetWidth }))
        .filter((item) => item.width > document.documentElement.clientWidth + 1)
        .sort((a, b) => b.width - a.width)[0];
      if (wide) widest = `${wide.node.tagName}.${String((wide.node as HTMLElement).className).slice(0, 80)} ${wide.width}`;
    }
    return `${delta}:${widest}`;
  });
}

test("product routes use the product shell", async ({ page, browser }) => {
  test.setTimeout(180_000);
  watch(page);
  await page.goto("/signin");
  await expect(page.getByRole("heading", { name: "Website editor" })).toBeVisible();
  await page.goto("/sites");
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
  await page.goto("/sites/web_harbor");
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toBeVisible();
  await page.goto("/sites/new");
  await expect(page.getByRole("heading", { name: "Connect a website" })).toBeVisible();
  await page.goto("/sites/web_harbor/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await page.goto("/sites/web_missing/editor");
  await expect(page.getByRole("heading", { name: "This page is not here." })).toBeVisible();
  await page.goto("/this-page-is-missing");
  await expect(page.getByRole("heading", { name: "This page is not here." })).toBeVisible();

  const editor = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const editorPage = await editor.newPage();
  watch(editorPage);
  await editorPage.goto("/signin");
  await editorPage.getByRole("button", { name: "Continue as Harbor editor" }).click();
  await expect(editorPage).not.toHaveURL(/\/signin/, { timeout: 20_000 });
  await editorPage.goto("/sites/web_quantum_age/editor");
  await expect(editorPage.getByRole("heading", { name: "You do not have access to this website." })).toBeVisible();
  await editorPage.screenshot({ path: "docs/product-hallmark/after/denied.png" });
  await editor.close();

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/signin", "/sites", "/sites/web_harbor/editor"]) {
    await page.goto(path);
    const delta = await overflowDelta(page);
    const pixels = Number(delta.split(":")[0]);
    console.log(`OVERFLOW ${path} ${delta}`);
    if (!path.endsWith("/editor")) expect(pixels, `${path} ${delta}`).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sites/web_harbor/editor");
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();

  const unexpected = consoleErrors.filter((line) => !/cookie|sandbox|favicon|web_missing|this-page-is-missing|forced editor error/i.test(line));
  expect(unexpected, unexpected.join("\n")).toEqual([]);
  expect(hydration).toEqual([]);
});
