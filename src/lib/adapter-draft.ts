import { siteDraftSchema, type SiteDraft } from "@/lib/content-schema";
import { createSection } from "@/lib/page-documents";
import type { EditorAdapterView } from "@/platform/editor-adapter";

function routesOf(adapter: EditorAdapterView) {
  const routes = adapter.fields.routes;
  if (!Array.isArray(routes)) return [];
  return routes.flatMap((route) => {
    if (!route || typeof route !== "object") return [];
    const path = (route as { path?: unknown }).path;
    const title = (route as { title?: unknown }).title;
    if (typeof path !== "string" || typeof title !== "string" || path.includes(":")) return [];
    return [{ path, title }];
  });
}

function colorsOf(adapter: EditorAdapterView) {
  const theme = adapter.fields.theme;
  const tokens = theme && typeof theme === "object" ? (theme as { tokens?: unknown }).tokens : null;
  const values = Array.isArray(tokens)
    ? tokens.flatMap((token) => {
        if (!token || typeof token !== "object") return [];
        const value = (token as { value?: unknown }).value;
        const kind = (token as { kind?: unknown }).kind;
        return kind === "color" && typeof value === "string" ? [value] : [];
      })
    : [];
  return {
    ink: values[0] ?? "#1c1917",
    plum: values[1] ?? "#44403c",
    green: values[2] ?? "#78716c",
    paper: values[3] ?? "#fafaf9",
  };
}

/** A first draft for a site that has its own workspace. It does not use another site's seed. */
export function siteDraftFromAdapter(adapter: EditorAdapterView, name: string): SiteDraft {
  const routes = routesOf(adapter);
  const pages = routes.some((route) => route.path === "/") ? routes : [{ path: "/", title: "Home" }, ...routes];
  return siteDraftSchema.parse({
    version: 3,
    chrome: {
      header: {
        logo: "",
        siteName: name,
        buttonLabel: "",
        buttonHref: "/",
        sticky: false,
        social: [],
        hiddenOn: [],
        phoneCompact: false,
      },
      footer: { copyright: name, note: "", links: [], contact: [], social: [], images: [] },
      announcement: { enabled: false, text: "", href: "" },
      profile: { name, phone: "", email: "", address: "" },
      theme: { ...colorsOf(adapter), font: "sans", button: "filled", spacing: "comfortable" },
      favicon: "",
      cookieText: "",
      analyticsId: "",
    },
    pages: pages.map((page) => {
      const heading = createSection("heading");
      return {
        id: page.path === "/" ? "page-home" : `page-${page.path.slice(1).replace(/\//g, "-")}`,
        route: page.path,
        title: page.title,
        template: page.path === "/" ? "home" : "canvas",
        navVisible: page.path !== "/",
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
