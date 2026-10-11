export type CompareKind = "route" | "title" | "seo" | "media" | "lock" | "text";

export type CompareItem = {
  path: string;
  kind: CompareKind;
};

export type CompareReport = {
  ok: boolean;
  missing: CompareItem[];
};

const copyKeys = new Set([
  "text",
  "label",
  "title",
  "seoTitle",
  "metaDescription",
  "alt",
  "caption",
  "address",
  "siteName",
  "buttonLabel",
  "copyright",
  "note",
  "cookieText",
  "name",
  "tagline",
  "positioning",
]);

type CopyHit = { path: string; value: string; kind: CompareKind };

function kindFor(path: string): CompareKind {
  if (path.endsWith("/title")) return "title";
  if (path.endsWith("/seoTitle") || path.endsWith("/metaDescription")) return "seo";
  return "text";
}

function collectCopy(value: unknown, path: string, hits: CopyHit[]) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((child, index) => collectCopy(child, `${path}/${index}`, hits));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const here = `${path}/${key}`;
    if (key === "text" && child && typeof child === "object" && typeof (child as { text?: unknown }).text === "string") {
      const text = (child as { text: string }).text.trim();
      if (text.length >= 2) hits.push({ path: here, value: text, kind: "text" });
      continue;
    }
    if (typeof child === "string" && copyKeys.has(key)) {
      const text = child.trim();
      if (text.length >= 2) hits.push({ path: here, value: text, kind: kindFor(here) });
      continue;
    }
    collectCopy(child, here, hits);
  }
}

function collectStrings(value: unknown, found: Map<string, number>) {
  if (typeof value === "string") {
    const text = value.trim();
    if (text.length >= 2) found.set(text, (found.get(text) ?? 0) + 1);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child) => collectStrings(child, found));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const child of Object.values(value as Record<string, unknown>)) collectStrings(child, found);
}

function take(found: Map<string, number>, value: string) {
  const count = found.get(value) ?? 0;
  if (count <= 0) return false;
  if (count === 1) found.delete(value);
  else found.set(value, count - 1);
  return true;
}

function routesOf(value: unknown) {
  const routes: string[] = [];
  const pages = value && typeof value === "object" && "pages" in value ? (value as { pages?: unknown }).pages : undefined;
  if (!Array.isArray(pages)) return routes;
  for (const page of pages) {
    if (page && typeof page === "object" && typeof (page as { route?: unknown }).route === "string") routes.push((page as { route: string }).route);
  }
  return routes;
}

function mediaOf(value: unknown) {
  const names = new Set<string>();
  const walk = (node: unknown) => {
    if (typeof node === "string" && node.startsWith("/media/")) names.add(node.slice("/media/".length));
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object") Object.values(node as Record<string, unknown>).forEach(walk);
  };
  walk(value);
  return names;
}

function locksOf(value: unknown) {
  const locks: { id: string; locked: boolean }[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const record = node as {
      metadata?: { legacyId?: unknown };
      locked?: boolean | { locked?: boolean };
      source?: { providerManaged?: boolean };
      children?: unknown[];
      pages?: unknown[];
      root?: unknown;
    };
    if (typeof record.metadata?.legacyId === "string") {
      const locked = record.locked === true || (typeof record.locked === "object" && record.locked.locked === true) || record.source?.providerManaged === true;
      locks.push({ id: record.metadata.legacyId, locked });
    }
    for (const child of record.children ?? []) walk(child);
    for (const page of record.pages ?? []) walk(page);
    if (record.root) walk(record.root);
  };
  walk(value);
  return locks;
}

/** Lock ids use the same path keys as the assembler. */
export function legacyLocks(value: unknown): { id: string; locked: boolean }[] {
  if (!value || typeof value !== "object" || !("pages" in value) || !Array.isArray((value as { pages?: unknown }).pages)) return [];
  const list: { id: string; locked: boolean }[] = [];
  (value as { pages: Array<Record<string, unknown>> }).pages.forEach((page, pageIndex) => {
    const pageKey = `page/${pageIndex}/${String(page.id ?? pageIndex)}`;
    list.push({ id: pageKey, locked: page.locked === true || page.providerLocked === true });
    const sections = Array.isArray(page.sections) ? page.sections : [];
    sections.forEach((section, sectionIndex) => {
      if (!section || typeof section !== "object") return;
      const record = section as Record<string, unknown>;
      const sectionKey = `${pageKey}/section/${sectionIndex}/${String(record.id ?? sectionIndex)}`;
      list.push({ id: sectionKey, locked: record.locked === true || record.providerLocked === true });
      const blocks = Array.isArray(record.blocks) ? record.blocks : [];
      blocks.forEach((block, blockIndex) => {
        if (!block || typeof block !== "object") return;
        const item = block as Record<string, unknown>;
        list.push({
          id: `${sectionKey}/block/${blockIndex}/${String(item.id ?? blockIndex)}`,
          locked: item.locked === true || item.providerLocked === true,
        });
      });
    });
  });
  return list;
}

/** Compares visible copy and structure. Paths are returned without the source text. */
export function compareMigration(before: unknown, after: unknown, locks: { id: string; locked: boolean }[]): CompareReport {
  const hits: CopyHit[] = [];
  collectCopy(before, "", hits);
  const present = new Map<string, number>();
  collectStrings(after, present);
  const missing: CompareItem[] = [];
  for (const hit of hits) {
    if (!take(present, hit.value)) missing.push({ path: hit.path, kind: hit.kind });
  }
  const afterRoutes = new Set(routesOf(after));
  for (const route of routesOf(before)) {
    if (!afterRoutes.has(route)) missing.push({ path: route, kind: "route" });
  }
  const afterMedia = mediaOf(after);
  for (const name of mediaOf(before)) {
    if (!afterMedia.has(name)) missing.push({ path: name, kind: "media" });
  }
  const afterLocks = locksOf(after);
  for (const lock of locks) {
    const found = afterLocks.find((item) => item.id === lock.id);
    if (lock.locked && (!found || !found.locked)) missing.push({ path: lock.id, kind: "lock" });
    if (!lock.locked && found?.locked) missing.push({ path: lock.id, kind: "lock" });
  }
  return { ok: missing.length === 0, missing };
}
