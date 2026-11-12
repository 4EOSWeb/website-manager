import { expect, test } from "@playwright/test";

test("quantum age can add an insight, an article, a forum topic, and a form", async ({ page }) => {
  await page.goto("/sites/web_quantum_age/editor");
  await expect(page.getByRole("button", { name: "Add insight" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add article" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add topic" })).toBeVisible();
  await page.getByRole("button", { name: "Add topic" }).click();
  await expect(page.getByRole("button", { name: "New topic", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add article", exact: true }).click();
  await expect(page.getByRole("button", { name: "New article", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add insight", exact: true }).click();
  await expect(page.getByRole("button", { name: "New insight", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add a form" }).click();
  await expect(page.getByRole("button", { name: "Contact form" }).first()).toBeVisible();
});

test("harbor does not offer insights, articles, a forum, or forms", async ({ page }) => {
  await page.goto("/sites/web_harbor/editor");
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add insight" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add article" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add topic" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add a form" })).toHaveCount(0);
});
