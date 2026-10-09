import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

type Row = {
  route: string;
  app: "hub" | "site";
  template: string;
  ownership: "Editable" | "Provider-managed" | "Editor app" | "System";
  source: string;
};

const root = process.cwd();
const siteDir = path.join(root, ".workspaces", "web_quantum_age");
const overlayDir = path.join(root, "overlays", "quantum-age");

function pages(dir: string, base = ""): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "api" || name.startsWith("_")) continue;
      const segment = name.startsWith("(") ? "" : `/${name}`;
      found.push(...pages(full, base + segment));
    } else if (name === "page.tsx" || name === "route.ts") {
      found.push(`${base || "/"}${name === "route.ts" ? " (route handler)" : ""}`);
    } else if (["not-found.tsx", "error.tsx", "loading.tsx"].includes(name)) {
      found.push(`${base || "/"} [${name.replace(".tsx", "")}]`);
    }
  }
  return found;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function stateTemplate(route: string) {
  if (route.endsWith("[not-found]")) return "Not found";
  if (route.endsWith("[error]")) return "Error screen";
  if (route.endsWith("[loading]")) return "Loading screen";
  return "Editor app";
}

const rows: Row[] = [];
const hubTemplates: Record<string, string> = {
  "/": "Redirect to the right website",
  "/signin": "Sign in",
  "/sites": "Website chooser",
  "/sites/[websiteId]/editor": "Visual editor",
  "/preview/[websiteId]/[[...path]] (route handler)": "Signed preview proxy",
};
for (const route of pages(path.join(root, "src", "app"))) {
  rows.push({
    route,
    app: "hub",
    template: hubTemplates[route] ?? stateTemplate(route),
    ownership: / \[/.test(route) ? "System" : "Editor app",
    source: "src/app",
  });
}

const site = readJson<{ pages: { route: string; template?: string; locked?: boolean; archived?: boolean; title: string }[] }>(
  path.join(siteDir, "src", "content", "editor", "site.json"),
  { pages: [] },
);
const siteRoutes = new Set([...pages(path.join(siteDir, "src", "app")), ...pages(path.join(overlayDir, "src", "app"))]);
for (const route of [...siteRoutes].sort()) {
  if (route === "/insights/[slug]" || route === "/[slug]") continue;
  const page = site.pages.find((item) => item.route === route);
  rows.push({
    route,
    app: "site",
    template: / \[/.test(route) ? stateTemplate(route) : page ? `${page.template ?? "marketing"} page` : route === "/search" ? "Search results" : route === "/prototype-notes" ? "Prototype notes (not linked)" : "Site page",
    ownership: page?.locked ? "Provider-managed" : page ? "Editable" : "Provider-managed",
    source: "site app",
  });
}
for (const page of site.pages) {
  if (siteRoutes.has(page.route)) continue;
  rows.push({ route: page.route, app: "site", template: `Custom ${page.template ?? "landing"} page via /[slug]`, ownership: page.locked ? "Provider-managed" : "Editable", source: "site.json" });
}
if (!site.pages.some((page) => !siteRoutes.has(page.route))) {
  rows.push({ route: "/[slug]", app: "site", template: "Custom page template (no custom pages yet)", ownership: "Editable", source: "site app" });
}

const articles = readJson<{ slug: string; title: string }[]>(path.join(siteDir, "src", "content", "articles.json"), []);
for (const article of articles) {
  rows.push({ route: `/insights/${article.slug}`, app: "site", template: "Insights article (HTML, read only)", ownership: "Provider-managed", source: "articles.json" });
}
const blogDir = path.join(siteDir, "src", "content", "blog");
for (const file of existsSync(blogDir) ? readdirSync(blogDir).filter((name) => name.endsWith(".json")) : []) {
  const post = readJson<{ slug: string }>(path.join(blogDir, file), { slug: file.replace(/\.json$/, "") });
  rows.push({ route: `/insights/${post.slug}`, app: "site", template: "Insights post (structured, editable)", ownership: "Editable", source: "content/blog" });
}

const surfaces = [
  "Top bar", "Tool rail", "Pages explorer", "Add panel and library", "Layers", "Site styles", "Media library", "Properties inspector",
  "Page settings", "Selection toolbar and menu", "Inline text toolbar", "Crop dialog", "Image picker", "Publish history",
  "Add page form", "Publish review", "Status bar",
];

mkdirSync(path.join(root, "tests", "e2e"), { recursive: true });
writeFileSync(
  path.join(root, "tests", "e2e", "routes.json"),
  JSON.stringify(rows.filter((row) => row.app === "site" && !row.route.includes("[")).map((row) => row.route), null, 2) + "\n",
);

const header = "| Route | App | Page or template | Editable or managed | Desktop | Tablet | Mobile | Hallmark | Copy | Accessibility | Functional | Problems | Resolution | Result |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n";
const body = rows.map((row) => `| \`${row.route}\` | ${row.app} | ${row.template} | ${row.ownership} | - | - | - | - | - | - | - | - | - | - |`).join("\n");
const surfaceRows = surfaces.map((name) => `| ${name} | - | - | - | - | - | - | - |`).join("\n");
const out = process.argv.includes("--write") ? path.join(root, "docs", "route-audit.md") : null;
const markdown = `# Route audit\n\nGenerated by \`node --experimental-strip-types scripts/route-inventory.ts --write\`. ${rows.length} routes: ${rows.filter((row) => row.app === "hub").length} in the editor app and ${rows.filter((row) => row.app === "site").length} on the website, including ${articles.length} Insights articles.\n\n## Routes\n\n${header}${body}\n\n## Editor surfaces\n\n| Surface | Desktop | Hallmark | Accessibility | Functional | Problems | Resolution | Result |\n|---|---|---|---|---|---|---|---|\n${surfaceRows}\n`;
if (out) writeFileSync(out, markdown);
console.log(`${rows.length} routes, ${surfaces.length} editor surfaces`);
