import pg from "pg";
import { siteDraftSchema, type SiteDraft } from "../src/lib/content-schema";
import { createSection } from "../src/lib/page-documents";
import { validateDocument } from "../src/platform/document/document";
import { createElement } from "../src/platform/elements/create";
import type { NodeDocument } from "../src/platform/document/node";

const pages = [
  { route: "/", title: "Home" },
  { route: "/work", title: "Work" },
  { route: "/studio", title: "Studio" },
  { route: "/journal", title: "Journal" },
  { route: "/visit", title: "Visit" },
];

export function harborSiteDraft(): SiteDraft {
  return siteDraftSchema.parse({
    version: 3,
    chrome: {
      header: {
        logo: "",
        siteName: "Harbor & Co.",
        buttonLabel: "Plan a visit",
        buttonHref: "/visit",
        sticky: false,
        social: [],
        hiddenOn: [],
        phoneCompact: false,
      },
      footer: {
        copyright: "Harbor & Co., Port City",
        note: "A coastal studio.",
        links: [],
        contact: [],
        social: [],
        images: [],
      },
      announcement: { enabled: false, text: "", href: "" },
      profile: { name: "Harbor & Co.", phone: "", email: "", address: "Port City" },
      theme: {
        ink: "#0F3D4C",
        plum: "#E26D5A",
        green: "#E6D3B1",
        paper: "#F7F1E8",
        font: "sans",
        button: "filled",
        spacing: "comfortable",
      },
      favicon: "",
      cookieText: "",
      analyticsId: "",
    },
    pages: pages.map((page) => {
      const heading = createSection("heading");
      return {
        id: `page-${page.title.toLowerCase()}`,
        route: page.route,
        title: page.title,
        template: page.route === "/" ? "home" : "canvas",
        navVisible: page.route !== "/",
        archived: false,
        seoTitle: page.title,
        metaDescription: "",
        locked: false,
        sections: [heading.type === "heading" ? { ...heading, text: page.title } : heading],
      };
    }),
    sectionTemplates: [],
  });
}

function canvasPage(route: string, title: string, children: NodeDocument[]) {
  const root = createElement("section", "generic.section", {});
  root.layout = { mode: "canvas", snap: 0, showGrid: false };
  root.children = children;
  return { id: root.id.replace(/^node_/, "page_"), route, title, metadata: {}, root };
}

export function harborVisualDocument() {
  const document = {
    version: 1 as const,
    pages: pages.map((page) => {
      const heading = createElement("heading", "generic.heading", { text: page.title, level: 1 });
      const children = page.route === "/visit"
        ? [heading, createElement("custom", "harbor.tide-clock", { label: "Tide clock" })]
        : [heading];
      return canvasPage(page.route, page.title, children);
    }),
  };
  const checked = validateDocument(document);
  if (!checked.ok) throw new Error(checked.error.message);
  return checked.value;
}

async function main() {
  const draft = harborSiteDraft();
  const visual = harborVisualDocument();
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/website_manager" });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into websites (id, client_id, name, production_url, github_owner, github_repository, default_branch, editor_status, manifest)
       values ($1, $2, $3, $4, $5, $6, $7, 'APPROVED', $8::jsonb)
       on conflict (id) do update set name = excluded.name, production_url = excluded.production_url, github_owner = excluded.github_owner, github_repository = excluded.github_repository, editor_status = 'APPROVED'`,
      ["web_harbor", "client_quantum_age", "Harbor & Co.", "https://harbor.example", "harbor", "harbor-site", "main", JSON.stringify({ site: "web_harbor" })],
    );
    await client.query(
      `insert into website_memberships (id, user_id, website_id, role)
       values ($1, $2, $3, 'CLIENT_ADMIN')
       on conflict (user_id, website_id) do update set role = 'CLIENT_ADMIN'`,
      ["member_harbor_admin", "user_admin", "web_harbor"],
    );
    await client.query(
      `insert into pages (id, website_id, route, title, status, editable_manifest, updated_at)
       values ($1, $2, '/', 'Home', 'ACTIVE', '{}'::jsonb, now())
       on conflict (website_id, route) do update set title = 'Home', updated_at = now()`,
      ["page_harbor_home", "web_harbor"],
    );
    await client.query(
      `insert into workspace_drafts (id, website_id, user_id, page_id, draft_data, visual_document, updated_at)
       values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, now())
       on conflict (website_id, user_id, page_id) do update set draft_data = excluded.draft_data, visual_document = excluded.visual_document, updated_at = now()`,
      ["draft_harbor_admin", "web_harbor", "user_admin", "page_harbor_home", JSON.stringify(draft), JSON.stringify(visual)],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith("register-harbor-site.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
