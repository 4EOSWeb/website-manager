import { expect, test } from "@playwright/test";

const quantumPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const harborPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

test("each media library shows only its own files", async ({ page }) => {
  test.setTimeout(180_000);
  const harborUpload = await page.request.post("/api/sites/web_harbor/media", {
    multipart: {
      file: { name: "harbor-pier.png", mimeType: "image/png", buffer: harborPng },
      alt: "harbor-pier.png",
    },
  });
  expect(harborUpload.ok()).toBeTruthy();
  const harbor = (await harborUpload.json()) as { id: string; filename: string };
  const quantumUpload = await page.request.post("/api/sites/web_quantum_age/media", {
    multipart: {
      file: { name: "quantum-mark.png", mimeType: "image/png", buffer: quantumPng },
      alt: "quantum-mark.png",
    },
  });
  expect(quantumUpload.ok()).toBeTruthy();
  const quantum = (await quantumUpload.json()) as { id: string; filename: string };

  try {
    const cross = await page.request.get(`/api/sites/web_harbor/media?id=${encodeURIComponent(quantum.id)}`);
    expect(cross.status()).toBe(404);
    const harborSame = await page.request.get(`/api/sites/web_harbor/media?id=${encodeURIComponent(harbor.id)}`);
    expect(harborSame.status()).toBe(200);
    const quantumSame = await page.request.get(`/api/sites/web_quantum_age/media?id=${encodeURIComponent(quantum.id)}`);
    expect(quantumSame.status()).toBe(200);

    await page.goto("/sites/web_harbor/editor");
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Media" }).click();
    const harborPanel = page.locator(".ed-media-list");
    await expect(harborPanel.getByText("harbor-pier.png")).toBeVisible();
    await expect(harborPanel.getByText("quantum-mark.png")).toHaveCount(0);
    const harborSrcs = await harborPanel.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""));
    expect(harborSrcs.some((src) => src.includes(harbor.filename))).toBe(true);
    expect(harborSrcs.some((src) => src.includes(quantum.filename))).toBe(false);

    await page.goto("/sites/web_quantum_age/editor");
    await page.getByRole("navigation", { name: "Editor panels" }).getByRole("button", { name: "Media" }).click();
    const quantumPanel = page.locator(".ed-media-list");
    await expect(quantumPanel.getByText("quantum-mark.png")).toBeVisible();
    await expect(quantumPanel.getByText("harbor-pier.png")).toHaveCount(0);
    const quantumSrcs = await quantumPanel.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""));
    expect(quantumSrcs.some((src) => src.includes(quantum.filename))).toBe(true);
    expect(quantumSrcs.some((src) => src.includes(harbor.filename))).toBe(false);
  } finally {
    await page.request.delete("/api/sites/web_harbor/media", { data: { filename: harbor.filename } });
    await page.request.delete("/api/sites/web_quantum_age/media", { data: { filename: quantum.filename } });
  }
});
