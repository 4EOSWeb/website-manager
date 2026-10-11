import { createHash } from "node:crypto";
import type { ValidateDocumentHook } from "../adapter/validate-hook";
import type { SiteContext } from "../context";
import { migrationFailed } from "../errors";
import { convertButton, type ButtonMigrationAdapter } from "./convert-button";
import { convertFreeform, type FreeformAdapter } from "./convert-freeform";
import { convertPages } from "./convert-page";
import { convertSection, type SectionMigrationAdapter } from "./convert-section";
import { convertSeo } from "./convert-seo";
import { convertText, type TextMigrationAdapter } from "./convert-text";
import { detectVersion } from "./detect";
import { assertLocksPreserved, type LockOutput, type LockSource } from "./locks";
import { missingMedia } from "./media-refs";
import { parseVersion3 } from "./parse-v3";
import { unmappedReport, type UnmappedField } from "./report";
import { assertRoutesPreserved } from "./routes";
import { validateMigrated } from "./validate";

export type AssembleAdapter = TextMigrationAdapter & ButtonMigrationAdapter & SectionMigrationAdapter & FreeformAdapter;

export type AssembleReport = {
  ok: boolean;
  detected: "3" | "1" | "unknown";
  shape: "site" | "home" | "visual" | "rejected";
  errors: string[];
  warnings: { path: string; message: string }[];
  routes: string[];
  missingMedia: string[];
  locksOk: boolean;
  validationOk: boolean;
  unmapped: UnmappedField[];
  document?: unknown;
};

function alloc(prefix: "page" | "node" | "grp", seed: string, used: Set<string>) {
  let n = 0;
  let id = "";
  do {
    id = `${prefix}_${createHash("sha256").update(`${seed}:${n}`).digest("hex").slice(0, 12)}`;
    n += 1;
  } while (used.has(id));
  used.add(id);
  return id;
}

function readText(block: Record<string, unknown>) {
  if (typeof block.text === "string") return { text: block.text, marks: [] as unknown[] };
  if (block.text && typeof block.text === "object" && "text" in block.text) {
    const rich = block.text as { text?: unknown; marks?: unknown };
    return { text: typeof rich.text === "string" ? rich.text : "", marks: Array.isArray(rich.marks) ? rich.marks : [] };
  }
  return { text: "", marks: [] as unknown[] };
}

function blockNode(block: Record<string, unknown>, adapter: AssembleAdapter, used: Set<string>, seed: string, legacyId: string) {
  const text = convertText(block, adapter);
  const button = text ? null : convertButton(block, adapter);
  const base = text ?? button;
  if (base) return { ...base, id: alloc("node", seed, used), metadata: { ...base.metadata, legacyId } };
  const rich = readText(block);
  const locked = block.locked === true || block.providerLocked === true;
  return {
    id: alloc("node", seed, used),
    type: "custom" as const,
    componentId: "custom",
    props: { text: rich.text, marks: rich.marks },
    styles: {},
    responsive: {},
    children: [],
    visibility: { hidden: block.hidden === true, hideOn: [] },
    locked: { locked },
    metadata: { legacyId, unmapped: structuredClone(block) },
    source: { origin: "migration" as const, providerManaged: block.providerLocked === true },
  };
}

function stamp(node: { id?: string; type?: string; metadata?: { legacyId?: unknown }; children?: unknown[] }, seed: string, used: Set<string>): Record<string, unknown> {
  const legacyId = node.metadata?.legacyId ?? node.id;
  const prefix = node.type === "group" ? "grp" : "node";
  return {
    ...node,
    id: alloc(prefix, seed, used),
    metadata: { ...(node.metadata ?? {}), legacyId },
    children: (node.children ?? []).map((child, index) => stamp(child as { id?: string; type?: string; metadata?: { legacyId?: unknown }; children?: unknown[] }, `${seed}/${index}`, used)),
  };
}

function sectionNode(section: Record<string, unknown>, adapter: AssembleAdapter, used: Set<string>, seed: string, legacyId: string) {
  const shell = convertSection(section, adapter);
  const locked = section.locked === true || section.providerLocked === true;
  const children = section.type === "freeform"
    ? convertFreeform({ items: Array.isArray(section.items) ? section.items as Record<string, unknown>[] : [] }, adapter).children.map((child, index) => stamp(child, `${seed}/item/${index}`, used))
    : (Array.isArray(section.blocks) ? section.blocks : []).map((block, index) => {
        if (!block || typeof block !== "object") return blockNode({}, adapter, used, `${seed}/block/${index}`, `${legacyId}/block/${index}`);
        const record = block as Record<string, unknown>;
        return blockNode(record, adapter, used, `${seed}/block/${index}`, `${legacyId}/block/${index}/${String(record.id ?? index)}`);
      });
  return {
    ...shell,
    id: alloc("node", seed, used),
    children,
    locked: { locked },
    source: { origin: "migration" as const, providerManaged: section.providerLocked === true },
    metadata: { ...shell.metadata, legacyId },
  };
}

function locksFromPages(pages: Array<Record<string, unknown>>): LockSource[] {
  const list: LockSource[] = [];
  pages.forEach((page, pageIndex) => {
    const pageKey = `page/${pageIndex}/${String(page.id ?? pageIndex)}`;
    list.push({ id: pageKey, locked: page.locked === true, providerLocked: page.providerLocked === true });
    const sections = Array.isArray(page.sections) ? page.sections : [];
    sections.forEach((section, sectionIndex) => {
      if (!section || typeof section !== "object") return;
      const record = section as Record<string, unknown>;
      const sectionKey = `${pageKey}/section/${sectionIndex}/${String(record.id ?? sectionIndex)}`;
      list.push({ id: sectionKey, locked: record.locked === true, providerLocked: record.providerLocked === true });
      const blocks = Array.isArray(record.blocks) ? record.blocks : [];
      blocks.forEach((block, blockIndex) => {
        if (!block || typeof block !== "object") return;
        const item = block as Record<string, unknown>;
        list.push({
          id: `${sectionKey}/block/${blockIndex}/${String(item.id ?? blockIndex)}`,
          locked: item.locked === true,
          providerLocked: item.providerLocked === true,
        });
      });
    });
  });
  return list;
}

function locksFromDocument(document: { pages?: Array<{ root?: unknown }> }): LockOutput[] {
  const list: LockOutput[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const record = node as { metadata?: { legacyId?: unknown }; locked?: LockOutput["locked"]; source?: { providerManaged?: boolean }; children?: unknown[] };
    if (record.metadata && typeof record.metadata.legacyId === "string") {
      list.push({ id: record.metadata.legacyId, locked: record.locked, source: record.source });
    }
    for (const child of record.children ?? []) walk(child);
  };
  for (const page of document.pages ?? []) walk(page.root);
  return list;
}

function firstMedia(value: Record<string, unknown>) {
  for (const child of Object.values(value)) {
    if (!child || typeof child !== "object" || Array.isArray(child)) continue;
    const record = child as Record<string, unknown>;
    if (typeof record.src !== "string" || !record.src.startsWith("/media/")) continue;
    return { src: record.src, alt: typeof record.alt === "string" ? record.alt : "" };
  }
  return null;
}

function homeDocument(value: Record<string, unknown>, adapter: AssembleAdapter, used: Set<string>) {
  const tagline = typeof value.tagline === "string" ? value.tagline : "";
  const positioning = typeof value.positioning === "string" ? value.positioning : "";
  const button = value.primaryButton && typeof value.primaryButton === "object" ? value.primaryButton as Record<string, unknown> : null;
  const children = [
    blockNode({ id: "tagline", kind: "heading", text: tagline, hidden: false }, adapter, used, "home/tagline", "home/tagline"),
  ];
  if (positioning) children.push(blockNode({ id: "positioning", kind: "paragraph", text: positioning, hidden: false }, adapter, used, "home/positioning", "home/positioning"));
  if (button) {
    children.push(blockNode({
      id: "primary",
      kind: "button",
      label: typeof button.label === "string" ? button.label : "",
      href: typeof button.href === "string" ? button.href : "",
      hidden: false,
    }, adapter, used, "home/button", "home/button"));
  }
  const image = firstMedia(value);
  if (image) children.push(blockNode({ id: "image", kind: "image", src: image.src, alt: image.alt, hidden: false }, adapter, used, "home/image", "home/image"));
  return {
    version: 1 as const,
    pages: [
      {
        id: alloc("page", "home", used),
        route: "/",
        title: "Home",
        metadata: { seoTitle: "", metaDescription: "", shareImage: "", legacyId: "home" },
        root: {
          id: alloc("node", "home/root", used),
          type: "section" as const,
          componentId: "section",
          props: {},
          styles: {},
          responsive: {},
          children,
          visibility: { hidden: false, hideOn: [] as string[] },
          locked: { locked: false },
          metadata: { legacyId: "home" },
          layout: { mode: "flow" as const, direction: "vertical" as const, gap: 16 },
          source: { origin: "migration" as const, providerManaged: false },
        },
      },
    ],
  };
}

function isHome(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.tagline === "string" && !("pages" in record) && !("version" in record);
}

function preserveMedia(document: unknown, before: unknown) {
  if (!document || typeof document !== "object" || !("pages" in document)) return;
  const pages = (document as { pages?: unknown }).pages;
  if (!Array.isArray(pages) || !pages[0] || typeof pages[0] !== "object") return;
  const root = (pages[0] as { root?: { metadata?: Record<string, unknown> } }).root;
  if (!root) return;
  const missing = missingMedia(before, document);
  if (missing.length === 0) return;
  root.metadata = { ...(root.metadata ?? {}), preservedMedia: missing.map((name) => `/media/${name}`) };
}

function finish(document: unknown, before: unknown, beforeRoutes: string[], beforeLocks: LockSource[], hook: ValidateDocumentHook, context: SiteContext, detected: AssembleReport["detected"], shape: AssembleReport["shape"], warnings: AssembleReport["warnings"]): AssembleReport {
  preserveMedia(document, before);
  const validated = validateMigrated(document, hook, context);
  const pages = document && typeof document === "object" && "pages" in document && Array.isArray(document.pages) ? document.pages as Array<{ route?: string }> : [];
  const routes = pages.map((page) => page.route ?? "");
  const media = missingMedia(before, document);
  const routeCheck = assertRoutesPreserved(beforeRoutes, routes);
  const lockCheck = assertLocksPreserved(beforeLocks, locksFromDocument(document as { pages?: Array<{ root?: unknown }> }));
  const unmapped = unmappedReport(document);
  const validationOk = validated.ok;
  const locksOk = lockCheck.ok;
  const errors = [
    ...(validated.ok ? [] : [validated.error.message]),
    ...(routeCheck.ok ? [] : [routeCheck.error.message]),
    ...(media.length ? [migrationFailed().message] : []),
    ...(lockCheck.ok ? [] : [lockCheck.error.message]),
  ];
  return {
    ok: validationOk && routeCheck.ok && media.length === 0 && locksOk,
    detected,
    shape,
    errors,
    warnings: validated.ok ? [...warnings, ...validated.value.warnings] : warnings,
    routes,
    missingMedia: media,
    locksOk,
    validationOk,
    unmapped,
    document,
  };
}

/** Converts one stored draft in memory. The caller does not write the database. */
export function assembleDraft(value: unknown, adapter: AssembleAdapter, hook: ValidateDocumentHook, context: SiteContext): AssembleReport {
  const detected = detectVersion(value);
  if (detected === 3) {
    const parsed = parseVersion3(value);
    if (!parsed.ok) {
      return { ok: false, detected: "3", shape: "rejected", errors: parsed.issues.map((issue) => issue.message), warnings: [], routes: [], missingMedia: [], locksOk: false, validationOk: false, unmapped: [] };
    }
    const used = new Set<string>();
    const converted = convertPages(parsed.value);
    const seoWarnings: AssembleReport["warnings"] = [];
    const pages = parsed.value.pages.map((page, pageIndex) => {
      const pageKey = `page/${pageIndex}/${page.id}`;
      const seo = convertSeo(page);
      for (const note of seo.notes) seoWarnings.push({ path: `${pageKey}.${note.key}`, message: note.reason });
      const sections = page.sections.map((section, sectionIndex) => sectionNode(section as unknown as Record<string, unknown>, adapter, used, `${pageKey}/section/${sectionIndex}`, `${pageKey}/section/${sectionIndex}/${section.id}`));
      return {
        id: alloc("page", pageKey, used),
        route: page.route,
        title: page.title,
        metadata: { seoTitle: seo.seoTitle, metaDescription: seo.metaDescription, shareImage: seo.shareImage },
        root: {
          id: alloc("node", `${pageKey}/root`, used),
          type: "section" as const,
          componentId: "section",
          props: {},
          styles: {},
          responsive: {},
          children: sections,
          visibility: { hidden: false, hideOn: [] as string[] },
          locked: { locked: page.locked === true },
          metadata: { legacyId: pageKey },
          layout: { mode: "flow" as const, direction: "vertical" as const, gap: 16 },
          source: { origin: "migration" as const, providerManaged: false },
        },
      };
    });
    return finish(
      { version: 1, pages },
      parsed.value,
      parsed.value.pages.map((page) => page.route),
      locksFromPages(parsed.value.pages as unknown as Array<Record<string, unknown>>),
      hook,
      context,
      "3",
      "site",
      [...converted.warnings.map((warning) => ({ path: warning.route, message: warning.message })), ...seoWarnings],
    );
  }
  if (isHome(value)) {
    const used = new Set<string>();
    const document = homeDocument(value, adapter, used);
    return finish(document, value, ["/"], [], hook, context, "unknown", "home", []);
  }
  if (detected === 1) {
    return finish(value, value, [], [], hook, context, "1", "visual", []);
  }
  return { ok: false, detected: "unknown", shape: "rejected", errors: [migrationFailed().message], warnings: [], routes: [], missingMedia: [], locksOk: false, validationOk: false, unmapped: [] };
}
