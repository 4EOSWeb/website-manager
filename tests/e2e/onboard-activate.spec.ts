import pg from "pg";
import { expect, test } from "@playwright/test";

async function quantumDrafts() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/website_manager",
  });
  await client.connect();
  try {
    const result = await client.query("select count(*)::int as count from workspace_drafts where website_id = 'web_quantum_age'");
    return result.rows[0].count as number;
  } finally {
    await client.end();
  }
}

test("activate stays off when the report has a failure", async ({ page }) => {
  const before = await quantumDrafts();
  await page.goto("/sites/new");
  const form = page.getByRole("form", { name: "Connect a website" });
  await form.getByRole("textbox", { name: "Site name" }).fill("North Harbor");
  await form.getByRole("textbox", { name: "Site id" }).fill("web_report_demo");
  await form.getByRole("textbox", { name: "Owner" }).fill("harbor");
  await form.getByRole("textbox", { name: "Repository name" }).fill("harbor-site");
  await form.getByRole("textbox", { name: "Adapter path" }).fill("fixtures/harbor/adapter.ts");
  await form.getByRole("textbox", { name: "Content path" }).fill("src/content");
  await form.getByRole("textbox", { name: "Media path" }).fill("public");
  await form.getByRole("textbox", { name: "Theme source" }).fill("adapter");
  await form.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("region", { name: "Compatibility report" })).toBeVisible();
  await expect(form.getByRole("button", { name: "Activate" })).toBeDisabled();
  await expect(form.getByText("Nothing was connected.")).toBeVisible();
  await expect(form.getByRole("textbox", { name: "Site name" })).toHaveValue("North Harbor");
  await expect(form.getByRole("textbox", { name: "Owner" })).toHaveValue("harbor");
  expect(await quantumDrafts()).toBe(before);
  await page.goto("/sites");
  await expect(page.getByText("web_report_demo")).toHaveCount(0);
});
