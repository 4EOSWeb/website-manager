import type { PageCapabilities } from "@/platform/adapter/page-capabilities";

const FLAG_KEYS = [
  "editMetadata",
  "editHeader",
  "editBody",
  "editSidebar",
  "editCta",
  "lockLayout",
  "lockContent",
  "providerManaged",
] as const satisfies readonly (keyof PageCapabilities)[];

/** Article address pattern from the adapter. Disabled articles have no pattern. */
export function articlePatternOf(adapter: unknown): string | null {
  if (!adapter || typeof adapter !== "object") return null;
  const articles = (adapter as { articles?: { enabled?: unknown; routePattern?: unknown } }).articles;
  if (!articles || articles.enabled !== true || typeof articles.routePattern !== "string" || !articles.routePattern.includes(":slug")) return null;
  return articles.routePattern;
}

/** How article bodies are stored. Null when articles are off. */
export function articleBodyKind(adapter: unknown): "structured" | "html-preserved" | null {
  if (!adapter || typeof adapter !== "object") return null;
  const articles = (adapter as { articles?: { enabled?: unknown; body?: unknown } }).articles;
  if (!articles || articles.enabled !== true) return null;
  return articles.body === "html-preserved" || articles.body === "structured" ? articles.body : null;
}

/** Exact routes match themselves. A `:slug` pattern matches one path segment. */
export function routeMatchesPattern(pattern: string, route: string): boolean {
  const token = ":slug";
  const index = pattern.indexOf(token);
  if (index < 0) return pattern === route;
  const prefix = pattern.slice(0, index);
  const suffix = pattern.slice(index + token.length);
  if (!route.startsWith(prefix) || (suffix && !route.endsWith(suffix))) return false;
  const slug = route.slice(prefix.length, suffix ? route.length - suffix.length : undefined);
  return Boolean(slug) && !slug.includes("/");
}

export function isArticleRoute(adapter: unknown, route: string): boolean {
  const pattern = articlePatternOf(adapter);
  return pattern ? routeMatchesPattern(pattern, route) : false;
}

function flagsFrom(value: object): Partial<PageCapabilities> {
  const source = value as Record<string, unknown>;
  const flags: Partial<PageCapabilities> = {};
  for (const key of FLAG_KEYS) {
    if (typeof source[key] === "boolean") flags[key] = source[key];
  }
  return flags;
}

/** Per-route flags. An exact address wins over a pattern. */
export function routeFlagsFor(adapter: unknown, route: string): Partial<PageCapabilities> | null {
  if (!adapter || typeof adapter !== "object" || !route) return null;
  const map = (adapter as { routeCapabilities?: unknown }).routeCapabilities;
  if (!map || typeof map !== "object" || Array.isArray(map)) return null;
  const exact = (map as Record<string, unknown>)[route];
  if (exact && typeof exact === "object") return flagsFrom(exact);
  for (const [pattern, value] of Object.entries(map as Record<string, unknown>)) {
    if (!pattern.includes(":") || !value || typeof value !== "object") continue;
    if (routeMatchesPattern(pattern, route)) return flagsFrom(value);
  }
  return null;
}

export function applyRouteFlags(flags: PageCapabilities, routeFlags: Partial<PageCapabilities> | null): PageCapabilities {
  if (!routeFlags) return flags;
  const next = { ...flags, ...routeFlags };
  if (next.providerManaged && next.editBody) next.editBody = false;
  return next;
}
