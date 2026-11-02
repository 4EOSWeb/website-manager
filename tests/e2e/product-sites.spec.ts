import pg from "pg";
import { expect, test } from "@playwright/test";

function database() {
  return new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/website_manager",
  });
}

test("an administrator sees both sites as cards and can edit each one", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sites");
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose a website" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Connect a website" })).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quantum Age" })).toBeVisible();
  await expect(page.getByText("harbor.example")).toBeVisible();
  await expect(page.getByText("testsite.4eos.com")).toBeVisible();

  for (const [width, height, file] of [
    [1440, 900, "docs/product-hallmark/after/sites.png"],
    [768, 1024, "docs/product-hallmark/after/sites-768.png"],
    [390, 844, "docs/product-hallmark/after/sites-390.png"],
  ] as const) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.screenshot({ path: file, fullPage: true });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");

  await page.getByRole("link", { name: "Edit Harbor & Co." }).click();
  await expect(page).toHaveURL(/\/sites\/web_harbor\/editor/);
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();

  await page.goto("/sites");
  await page.getByRole("link", { name: "Edit Quantum Age" }).click();
  await expect(page).toHaveURL(/\/sites\/web_quantum_age\/editor/);
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
});

test("a client editor does not see connect on the website list", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as client editor" }).click();
  await expect(page).not.toHaveURL(/\/signin/);
  await page.goto("/sites");
  await expect(page.getByRole("heading", { name: "Your websites" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connect a website" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Quantum Age" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toHaveCount(0);
  await context.close();
});

test("an empty list tells an administrator to connect and a client editor that nothing is assigned", async ({ browser }) => {
  const client = database();
  await client.connect();
  const memberships = await client.query<{ id: string; website_id: string; role: string }>(
    "select id, website_id, role from website_memberships where user_id = 'user_editor'",
  );
  const sites = await client.query<{ id: string; editor_status: string }>("select id, editor_status from websites");
  try {
    await client.query("delete from website_memberships where user_id = 'user_editor'");
    const editor = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const editorPage = await editor.newPage();
    await editorPage.goto("/signin");
    await editorPage.getByRole("button", { name: "Continue as client editor" }).click();
    await expect(editorPage).not.toHaveURL(/\/signin/);
    await editorPage.goto("/sites");
    await expect(editorPage.getByText("No website is assigned to you.")).toBeVisible();
    await expect(editorPage.getByRole("link", { name: "Connect a website" })).toHaveCount(0);
    await expect(editorPage.locator(".product-card")).toHaveCount(0);
    await editorPage.screenshot({ path: "docs/product-hallmark/after/sites-empty-editor.png", fullPage: true });
    await editor.close();

    await client.query("update websites set editor_status = 'DISABLED'");
    const admin = await browser.newContext({ storageState: "tests/e2e/.auth/admin.json" });
    const adminPage = await admin.newPage();
    await adminPage.goto("/sites");
    await expect(adminPage.getByText("Nothing is connected yet.")).toBeVisible();
    await expect(adminPage.getByRole("link", { name: "Connect a website" })).toBeVisible();
    await expect(adminPage.locator(".product-card")).toHaveCount(0);
    await adminPage.screenshot({ path: "docs/product-hallmark/after/sites-empty-admin.png", fullPage: true });
    await admin.close();
  } finally {
    for (const site of sites.rows) {
      await client.query("update websites set editor_status = $2 where id = $1", [site.id, site.editor_status]);
    }
    for (const membership of memberships.rows) {
      await client.query(
        `insert into website_memberships (id, user_id, website_id, role)
         values ($1, 'user_editor', $2, $3)
         on conflict (user_id, website_id) do update set role = excluded.role`,
        [membership.id, membership.website_id, membership.role],
      );
    }
    await client.end();
  }
});
