/** Reserved addresses declared by the adapter. An empty list means nothing is reserved. */
export function reservedRoutesOf(adapter: unknown): string[] {
  const rules = adapter && typeof adapter === "object" ? (adapter as { pageRules?: { reservedRoutes?: unknown } }).pageRules : undefined;
  const list = rules?.reservedRoutes;
  if (!Array.isArray(list)) return [];
  return list.filter((route): route is string => typeof route === "string" && route.startsWith("/"));
}

export function routeReserved(route: string, adapter: unknown): boolean {
  return reservedRoutesOf(adapter).includes(route);
}
