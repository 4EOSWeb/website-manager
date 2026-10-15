export type ActivePage = {
  id: string;
  route: string;
  title: string;
  source: "visual" | "version3";
};

type PageRef = { id: string; route: string; title: string };

export function visualPages(value: unknown): PageRef[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as { version?: unknown; pages?: unknown };
  if (record.version !== 1 || !Array.isArray(record.pages)) return null;
  const pages: PageRef[] = [];
  for (const page of record.pages) {
    if (!page || typeof page !== "object") continue;
    const item = page as { id?: unknown; route?: unknown; title?: unknown };
    if (typeof item.id !== "string" || typeof item.route !== "string" || typeof item.title !== "string") continue;
    pages.push({ id: item.id, route: item.route, title: item.title });
  }
  return pages;
}

/** A stored visual document supplies the page. Version 3 is only the fallback. */
export function selectActivePage(path: string, visual: unknown, version3Pages: PageRef[]): ActivePage | null {
  const pages = visualPages(visual);
  if (pages) {
    const match = pages.find((page) => page.route === path);
    return match ? { ...match, source: "visual" } : null;
  }
  const legacy = version3Pages.find((page) => page.route === path);
  return legacy ? { ...legacy, source: "version3" } : null;
}

export function articlePatternFrom(adapter: Record<string, unknown> | null): string | null {
  if (!adapter) return null;
  const articles = adapter.articles;
  if (!articles || typeof articles !== "object") return null;
  const record = articles as { enabled?: unknown; routePattern?: unknown };
  if (record.enabled !== true || typeof record.routePattern !== "string" || !record.routePattern.includes(":slug")) return null;
  return record.routePattern;
}

export function articleRouteFor(pattern: string, slug: string) {
  return pattern.replace(":slug", slug);
}

export function articleSlug(pattern: string, path: string): string | null {
  const token = ":slug";
  const index = pattern.indexOf(token);
  if (index < 0) return null;
  const prefix = pattern.slice(0, index);
  const suffix = pattern.slice(index + token.length);
  if (!path.startsWith(prefix) || (suffix && !path.endsWith(suffix))) return null;
  const slug = path.slice(prefix.length, suffix ? path.length - suffix.length : undefined);
  if (!slug || slug.includes("/")) return null;
  return slug;
}
