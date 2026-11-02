import { expect, test } from "@playwright/test";

test("the compatibility report shows harbor checks without a token", async ({ page }) => {
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

  const report = page.getByRole("region", { name: "Compatibility report" });
  await expect(report).toBeVisible();
  await expect(report.getByText("The GitHub connection is not configured yet.")).toBeVisible();
  await expect(report.getByText("Fail").first()).toBeVisible();
  await expect(report.getByText("Pass").first()).toBeVisible();
  await expect(report.getByText("The preview did not respond.")).toBeVisible();
  const text = await report.innerText();
  expect(text).not.toMatch(/ghp_|private key|access token| at \//);
});
