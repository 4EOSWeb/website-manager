const ADDRESS_HELP = "Use a short address such as /new-service.";

/** The adapter slug pattern, or the generic lowercase path when the adapter does not set one. */
export function slugPatternOf(adapter: unknown): string {
  const rules = adapter && typeof adapter === "object" ? (adapter as { pageRules?: { slugPattern?: unknown } }).pageRules : undefined;
  const pattern = rules?.slugPattern;
  return typeof pattern === "string" && pattern.trim() ? pattern : "/[a-z0-9]+(?:-[a-z0-9]+)*";
}

/** Why an address cannot be used, or an empty string when it matches the pattern. */
export function slugProblem(route: string, pattern: string): string {
  const value = route.trim();
  if (!value || value === "/") return ADDRESS_HELP;
  const source = pattern.startsWith("^") ? pattern : `^(?:${pattern})$`;
  try {
    return new RegExp(source).test(value) ? "" : ADDRESS_HELP;
  } catch {
    return ADDRESS_HELP;
  }
}
