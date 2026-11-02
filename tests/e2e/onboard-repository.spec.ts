import pg from "pg";
import { expect, test } from "@playwright/test";

async function quantumRepository() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/website_manager",
  });
  await client.connect();
  try {
    const result = await client.query(
      "select github_owner, github_repository, github_installation_id, default_branch from websites where id = 'web_quantum_age'",
    );
    return result.rows[0];
  } finally {
    await client.end();
  }
}

test("repository owner and name are required and no token is collected", async ({ page }) => {
  const before = await quantumRepository();
  await page.goto("/sites/new");
  const form = page.getByRole("form", { name: "Connect a website" });
  await expect(form.locator('input[name="token"], input[type="password"]')).toHaveCount(0);
  await form.getByRole("button", { name: "Continue" }).click();
  await expect(form.getByText("Enter the repository owner.")).toBeVisible();
  await expect(form.getByText("Enter the repository name.")).toBeVisible();
  const branch = form.getByRole("textbox", { name: "Default branch" });
  await expect(branch).toHaveValue("main");
  await branch.fill("develop");
  await form.getByRole("button", { name: "Continue" }).click();
  await expect(branch).toHaveValue("develop");
  await expect(form.getByText("cannot contain spaces")).toHaveCount(0);
  await branch.fill("feature branch");
  await form.getByRole("button", { name: "Continue" }).click();
  await expect(form.getByText("The branch name cannot contain spaces.")).toBeVisible();
  expect(await quantumRepository()).toEqual(before);
});
