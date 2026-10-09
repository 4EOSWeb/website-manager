import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import routes from "./routes.json" with { type: "json" };
import { SITE } from "./helpers";

/**
 * Runs against a production build when SITE_URL is set (for example `next start` on the site
 * workspace). Without it, the routes load through the signed editor preview with the canvas off,
 * which still covers status, errors, and layout but not the public-only marker check.
 */
const PUBLIC = process.env.SITE_URL?.replace(/\/$/, "");
const WIDTHS = [1280, 768, 390];
const MISSING = "/this-page-does-not-exist";

type Result = { route: string; width: number; status: number; problems: string[] };

async function previewToken(page: Page) {
  await page.goto(`/sites/${SITE}/editor`);
  const href = await page.locator('a.ed-button[href*="clean=1"]').getAttribute("href", { timeout: 60_000 });
  const token = href ? new URL(href, "http://x").searchParams.get("t") : null;
  if (!token) throw new Error("The editor did not provide a preview link");
  return token;
}

function urlFor(route: string, token: string | null) {
  if (PUBLIC) return `${PUBLIC}${route}`;
  const [path, query] = route.split("?");
  return `/preview/${SITE}${path}?${query ? `${query}&` : ""}t=${encodeURIComponent(token ?? "")}&clean=1`;
}

async function check(page: Page, route: string, width: number, token: string | null): Promise<Result> {
  const problems: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    const text = message.text();
    if (message.type() === "error" && !(route === MISSING && /404/.test(text))) problems.push(`console: ${text.slice(0, 160)}`);
    if (/hydrat/i.test(text)) problems.push(`hydration: ${text.slice(0, 160)}`);
  };
  const onError = (error: Error) => problems.push(`page error: ${error.message.slice(0, 160)}`);
  page.on("console", onConsole);
  page.on("pageerror", onError);
  const response = await page.goto(urlFor(route, token), { waitUntil: "load" });
  const status = response?.status() ?? 0;
  if (status !== (route === MISSING ? 404 : 200)) problems.push(`status ${status}`);
  await page.waitForTimeout(150);
  const facts = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    markers: Array.from(document.querySelectorAll('[class*="eos-"], [data-editor-chrome], [data-editor-name], [data-eos], script[id^="eos"]'))
      .slice(0, 3)
      .map((node) => node.outerHTML.slice(0, 80)),
  }));
  if (facts.overflow > 1) problems.push(`horizontal overflow of ${facts.overflow}px`);
  if (PUBLIC && facts.markers.length) problems.push(`editor markers: ${facts.markers.join(" | ")}`);
  page.off("console", onConsole);
  page.off("pageerror", onError);
  return { route, width, status, problems };
}

test.describe("public routes", () => {
  test.describe.configure({ timeout: 15 * 60_000 });

  for (const width of WIDTHS) {
    test(`every route loads cleanly at ${width} pixels`, async ({ page }) => {
      const token = PUBLIC ? null : await previewToken(page);
      await page.setViewportSize({ width, height: 900 });
      const results: Result[] = [];
      for (const route of [...routes, MISSING]) results.push(await check(page, route, width, token));
      fs.mkdirSync("test-results", { recursive: true });
      fs.writeFileSync(`test-results/routes-${width}.json`, JSON.stringify({ target: PUBLIC ?? "editor preview", results }, null, 2));
      const failed = results.filter((item) => item.problems.length).map((item) => `${item.route}: ${item.problems.join("; ")}`);
      expect(failed, `${failed.length} of ${results.length} routes had problems`).toEqual([]);
    });
  }
});
