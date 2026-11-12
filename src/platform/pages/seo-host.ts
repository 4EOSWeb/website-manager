/** Host shown in the search preview. It comes from the adapter production address. */
export function seoHost(adapter: unknown): string {
  const site = adapter && typeof adapter === "object" ? (adapter as { site?: { productionUrl?: unknown } }).site : undefined;
  const value = site?.productionUrl;
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}
