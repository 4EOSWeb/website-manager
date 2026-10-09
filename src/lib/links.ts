export function validLink(href: string): boolean {
  return /^(\/[^\s]*|https:\/\/[^\s.]+\.[^\s]+|mailto:[^\s@]+@[^\s@]+|tel:\+?[\d\s()-]{5,})$/.test(href.trim());
}

export function linkProblem(href: string): string {
  if (!href.trim()) return "Add where this should go.";
  if (/^http:\/\//i.test(href)) return "Use the secure https:// version of this address.";
  if (!validLink(href)) return "Use a page path like /contact, or a full https://, mailto:, or tel: address.";
  return "";
}
