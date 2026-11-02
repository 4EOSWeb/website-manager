import { linkProblem, validLink } from "@/lib/links";

/** A usable address, or null when the value must not be saved. */
export function acceptLink(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || linkProblem(trimmed) || !validLink(trimmed)) return null;
  return trimmed;
}

export function linkTarget(openInNew: boolean): "same" | "new" {
  return openInNew ? "new" : "same";
}
