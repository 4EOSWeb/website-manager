export type ListedPage = {
  route: string;
  title: string;
  navLabel?: string;
  navVisible: boolean;
  archived: boolean;
  locked?: boolean;
  parentRoute?: string;
};

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function visualPages(visual: unknown): ListedPage[] {
  if (!visual || typeof visual !== "object") return [];
  const pages = (visual as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return [];
  return pages.flatMap((page) => {
    if (!page || typeof page !== "object") return [];
    const item = page as Record<string, unknown>;
    if (typeof item.route !== "string" || typeof item.title !== "string") return [];
    const metadata = item.metadata && typeof item.metadata === "object" ? (item.metadata as Record<string, unknown>) : {};
    const navLabel = typeof item.navLabel === "string" ? item.navLabel : typeof metadata.navLabel === "string" ? metadata.navLabel : undefined;
    const parentRoute = typeof item.parentRoute === "string" ? item.parentRoute : undefined;
    return [{
      route: item.route,
      title: item.title,
      navLabel,
      navVisible: flag(item.navVisible, flag(metadata.navVisible, true)),
      archived: flag(item.archived, flag(metadata.archived, false)),
      locked: item.locked === true || metadata.providerManaged === true,
      parentRoute,
    }];
  });
}

/** Visual pages win when they cover every current route. Otherwise the version 3 list stays. */
export function listedPages(visual: unknown, legacy: readonly ListedPage[]): ListedPage[] {
  const next = visualPages(visual);
  if (next.length === 0) return [...legacy];
  const routes = new Set(next.map((page) => page.route));
  if (legacy.some((page) => !routes.has(page.route))) return [...legacy];
  return next;
}

export function pageGroups(pages: readonly ListedPage[]): { title: string; items: ListedPage[] }[] {
  return [
    { title: "In the menu", items: pages.filter((page) => !page.archived && page.navVisible) },
    { title: "Not in the menu", items: pages.filter((page) => !page.archived && !page.navVisible) },
    { title: "Archived", items: pages.filter((page) => page.archived) },
  ];
}
