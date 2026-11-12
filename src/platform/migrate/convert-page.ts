import { createHash } from "node:crypto";

/** Visual document route. A mismatch is reported and the original route is kept. */
const visualRoute = /^\/[a-z0-9/-]*$/;

export type Version3PageInput = {
  id: string;
  route: string;
  title: string;
  seoTitle?: string;
  metaDescription?: string;
  shareImage?: string;
  sections?: unknown[];
};

export type RouteWarning = {
  route: string;
  message: string;
};

export type ConvertedPage = {
  id: string;
  route: string;
  title: string;
  metadata: {
    seoTitle: string;
    metaDescription: string;
    shareImage: string;
    originalRoute?: string;
  };
  root: {
    id: string;
    type: "section";
    componentId: "section";
    props: Record<string, never>;
    styles: Record<string, never>;
    responsive: Record<string, never>;
    children: [];
    visibility: { hidden: false; hideOn: [] };
    locked: { locked: false };
    metadata: { pending: "sections" };
    layout: { mode: "flow"; direction: "vertical"; gap: number };
    source: { origin: "migration"; providerManaged: false };
  };
};

function rootId(pageId: string) {
  return `node_${createHash("sha256").update(pageId).digest("hex").slice(0, 12)}`;
}

/** Maps version 3 pages to version 1 pages. Section bodies stay pending and are not copied. */
export function convertPages(draft: { pages: Version3PageInput[] }): { pages: ConvertedPage[]; warnings: RouteWarning[] } {
  const warnings: RouteWarning[] = [];
  const pages = draft.pages.map((page) => {
    const metadata: ConvertedPage["metadata"] = {
      seoTitle: page.seoTitle ?? "",
      metaDescription: page.metaDescription ?? "",
      shareImage: page.shareImage ?? "",
    };
    if (!visualRoute.test(page.route)) {
      metadata.originalRoute = page.route;
      warnings.push({ route: page.route, message: "This address does not match the site slug pattern." });
    }
    return {
      id: page.id,
      route: page.route,
      title: page.title,
      metadata,
      root: {
        id: rootId(page.id),
        type: "section" as const,
        componentId: "section" as const,
        props: {},
        styles: {},
        responsive: {},
        children: [] as [],
        visibility: { hidden: false as const, hideOn: [] as [] },
        locked: { locked: false as const },
        metadata: { pending: "sections" as const },
        layout: { mode: "flow" as const, direction: "vertical" as const, gap: 16 },
        source: { origin: "migration" as const, providerManaged: false },
      },
    } as ConvertedPage;
  });
  return { pages, warnings };
}
