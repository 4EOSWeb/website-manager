import pg from "pg";
import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

async function ensureHarborMember() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/website_manager",
  });
  await client.connect();
  try {
    await client.query(`
      INSERT INTO users (id, display_name, email, status)
      VALUES ('user_harbor_only', 'Harbor Editor', 'harbor@4eos.test', 'ACTIVE')
      ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE', platform_role = NULL
    `);
    await client.query(`
      INSERT INTO website_memberships (id, user_id, website_id, role)
      VALUES ('member_harbor_only', 'user_harbor_only', 'web_harbor', 'CLIENT_EDITOR')
      ON CONFLICT (user_id, website_id) DO UPDATE SET role = 'CLIENT_EDITOR'
    `);
    await client.query(`
      DELETE FROM website_memberships
      WHERE user_id = 'user_harbor_only' AND website_id <> 'web_harbor'
    `);
  } finally {
    await client.end();
  }
}

test("a Harbor member cannot open Quantum Age directly", async ({ page, browser }) => {
  test.setTimeout(180_000);
  await ensureHarborMember();
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as Harbor editor" }).click();
  await expect(page).not.toHaveURL(/\/signin/);

  await page.goto("/sites/web_quantum_age/editor");
  await expect(page.getByRole("heading", { name: "That page is not available" })).toBeVisible();
  const body = await page.content();
  expect(body).not.toContain("draft_0ddb6f7c7f7a");
  expect(body).not.toContain("4EOSWeb/quantum-age");
  expect(body).not.toContain("Approach");

  const allowed = await page.goto("/sites/web_harbor/editor");
  expect(allowed?.status()).toBe(200);
  const harborPages = page.locator(".ed-side");
  await expect(harborPages.getByRole("button", { name: "Work", exact: true })).toBeVisible();
  await expect(harborPages.getByRole("button", { name: "Approach", exact: true })).toHaveCount(0);

  const admin = await browser.newContext({ storageState: "tests/e2e/.auth/admin.json" });
  const adminPage = await admin.newPage();
  expect((await adminPage.goto("/sites/web_harbor/editor"))?.status()).toBe(200);
  expect((await adminPage.goto("/sites/web_quantum_age/editor"))?.status()).toBe(200);
  await admin.close();
});
