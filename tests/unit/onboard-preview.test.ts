import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { previewDidNotRespond, previewHomeUrl, validatePreview } from "../../src/platform/onboarding/validate-preview.ts";

test("harbor home produces ready and a closed port does not", async () => {
  const home = readFileSync("fixtures/harbor/src/app/page.tsx", "utf8");
  assert.match(home, /A coastal studio/);
  const server = createServer((request, response) => {
    response.setHeader("content-type", "text/html; charset=utf-8");
    if (request.url !== "/") {
      response.statusCode = 404;
      response.end("");
      return;
    }
    response.end(`<!doctype html><main><h2>A coastal studio</h2></main><script>parent.postMessage({ type: "4eos-ready", path: location.pathname }, "*")</script>`);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("The preview port was not assigned.");
  const browser = await chromium.launch();
  try {
    const listen = async (input: { url: string; readyEvent: string; timeoutMs: number }) => {
      const page = await browser.newPage();
      try {
        await page.setContent("<!doctype html><title>preview</title>");
        return await page.evaluate(async ({ src, eventName, timeoutMs }) => {
          return await new Promise<boolean>((resolve) => {
            const timer = window.setTimeout(() => resolve(false), timeoutMs);
            window.addEventListener("message", (event) => {
              const data = event.data as { type?: string; path?: string } | null;
              if (data?.type === eventName && data.path === "/") {
                window.clearTimeout(timer);
                resolve(true);
              }
            });
            const frame = document.createElement("iframe");
            frame.src = src;
            document.body.append(frame);
          });
        }, { src: input.url, eventName: input.readyEvent, timeoutMs: Math.min(input.timeoutMs, 5000) });
      } finally {
        await page.close();
      }
    };
    const origin = `http://127.0.0.1:${address.port}`;
    const ready = await validatePreview(previewHomeUrl(origin), listen);
    assert.deepEqual(ready, { ok: true });

    const closed = await validatePreview("http://127.0.0.1:9/", async ({ url }) => {
      await fetch(url, { signal: AbortSignal.timeout(500) });
      return true;
    });
    assert.deepEqual(closed, { ok: false, problem: previewDidNotRespond });
    assert.equal(previewDidNotRespond, "The preview did not respond.");
  } finally {
    await browser.close();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("the preview check does not import site components", () => {
  const source = readFileSync("src/platform/onboarding/validate-preview.ts", "utf8");
  assert.equal(source.includes("fixtures/harbor"), false);
  assert.equal(source.includes("from \"react\""), false);
  assert.equal(source.includes("quantum"), false);
});
