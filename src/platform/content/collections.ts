import { routeMatchesPattern } from "@/platform/pages/route-flags";

export type EditorCollection = {
  id: string;
  name: string;
  kind: "article" | "forum";
  routePattern: string;
  body: "structured" | "html-preserved";
  primary: boolean;
};

const collectionId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function labelFromPattern(pattern: string) {
  const segment = pattern.split("/").filter(Boolean)[0] ?? "articles";
  const word = segment.split(":")[0] || "articles";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function readCollection(value: unknown): EditorCollection | null {
  const item = record(value);
  if (!item) return null;
  const { id, name, kind, routePattern, body } = item;
  if (typeof id !== "string" || !collectionId.test(id)) return null;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 40) return null;
  if (kind !== "article" && kind !== "forum") return null;
  if (typeof routePattern !== "string" || !routePattern.includes(":slug")) return null;
  if (body !== "structured" && body !== "html-preserved") return null;
  return { id, name: name.trim(), kind, routePattern, body, primary: false };
}

/**
 * Collections a site can add. Declared collections win.
 * When none are declared, one collection is derived from the article pattern.
 */
export function editorCollections(adapter: unknown): EditorCollection[] {
  const source = record(adapter);
  const articles = record(source?.articles);
  const pattern = articles?.enabled === true && typeof articles.routePattern === "string" && articles.routePattern.includes(":slug") ? articles.routePattern : null;
  const body = articles?.body === "html-preserved" ? "html-preserved" : "structured";
  const declared = Array.isArray(source?.collections) ? source.collections.map(readCollection).filter((item): item is EditorCollection => Boolean(item)) : [];
  const seen = new Set<string>();
  const collections: EditorCollection[] = [];
  for (const item of declared) {
    if (seen.has(item.id) || seen.has(item.routePattern)) continue;
    seen.add(item.id);
    seen.add(item.routePattern);
    collections.push({ ...item, primary: item.routePattern === pattern });
  }
  if (pattern && !collections.some((item) => item.routePattern === pattern)) {
    const id = collections.some((item) => item.id === "articles") ? "primary-articles" : "articles";
    collections.unshift({ id, name: labelFromPattern(pattern), kind: "article", routePattern: pattern, body, primary: true });
  }
  return collections;
}

export function formsEnabled(adapter: unknown) {
  const capabilities = record(record(adapter)?.capabilities);
  return capabilities?.supportsForms === true;
}

export function collectionForPath(collections: readonly EditorCollection[], path: string) {
  return collections.find((item) => routeMatchesPattern(item.routePattern, path)) ?? null;
}

export function entryBelongs(post: { collection?: string }, collection: EditorCollection) {
  if (post.collection) return post.collection === collection.id;
  return collection.primary;
}

export function sameEntry(post: { slug: string; collection?: string }, slug: string, collection?: string) {
  return post.slug === slug && (post.collection ?? "") === (collection ?? "");
}

function singular(name: string) {
  return (name.endsWith("s") ? name.slice(0, -1) : name).toLowerCase();
}

export function addEntryLabel(collection: EditorCollection) {
  return collection.kind === "forum" ? "Add topic" : `Add ${singular(collection.name)}`;
}

export function newEntryTitle(collection: EditorCollection) {
  return collection.kind === "forum" ? "New topic" : `New ${singular(collection.name)}`;
}

export function collectionSaveError(collections: readonly EditorCollection[], draft: { collection?: string }) {
  if (!collections.length) return "This site does not have articles or a forum.";
  if (draft.collection && !collections.some((item) => item.id === draft.collection)) return "That collection is not on this site.";
  if (!draft.collection && !collections.some((item) => item.primary)) return "Choose a collection.";
  return null;
}

export function additionLine(adapter: unknown) {
  const names = editorCollections(adapter).map((item) => item.name);
  if (formsEnabled(adapter)) names.push("Forms");
  return names.length ? names.join(", ") : "Pages only";
}
