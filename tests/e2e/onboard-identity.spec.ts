import { expect, test } from "@playwright/test";

test("a duplicate site id is rejected and a new id stays in the form", async ({ page }) => {
  await page.goto("/sites/new");
  const id = page.getByRole("textbox", { name: "Site id" });
  await id.fill("web_quantum_age");
  await id.blur();
  const form = page.getByRole("form", { name: "Connect a website" });
  await expect(form.getByRole("alert")).toHaveText("That id is already used.");
  await id.fill("web_new_site");
  await id.blur();
  await expect(id).toHaveValue("web_new_site");
  await expect(form.getByRole("alert")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Site name" }).fill("North Harbor");
  await expect(page.getByRole("textbox", { name: "Site name" })).toHaveValue("North Harbor");
});
