import type { BlogDraft, FreeformItem, PageDocument, Placement, Section, SiteDraft } from "@/lib/content-schema";
import { clampPlacement, createFreeformItem, createId, createSection, templateSections, type LibraryBlock } from "@/lib/page-documents";

function mapPage(site: SiteDraft, route: string, update: (page: PageDocument) => PageDocument): SiteDraft {
  return { ...site, pages: site.pages.map((page) => (page.route === route ? update(page) : page)) };
}

function mapSection(site: SiteDraft, route: string, sectionId: string, update: (section: Section) => Section): SiteDraft {
  return mapPage(site, route, (page) => ({
    ...page,
    sections: page.sections.map((section) => (section.id === sectionId ? update(section) : section)),
  }));
}

export function pageByRoute(site: SiteDraft, route: string) {
  return site.pages.find((page) => page.route === route);
}

export function insertSection(site: SiteDraft, route: string, index: number, section: Section): SiteDraft {
  return mapPage(site, route, (page) => {
    if (page.locked) return page;
    const sections = page.sections.slice();
    const at = Math.max(0, Math.min(index, sections.length));
    sections.splice(at, 0, section);
    return { ...page, sections };
  });
}

export function moveSection(site: SiteDraft, route: string, from: number, to: number): SiteDraft {
  return mapPage(site, route, (page) => {
    if (page.locked) return page;
    const sections = page.sections.slice();
    if (to === from || to === from + 1) return page;
    const [moved] = sections.splice(from, 1);
    if (!moved || (moved.type === "preset" && moved.providerLocked)) return page;
    const at = Math.max(0, Math.min(from < to ? to - 1 : to, sections.length));
    sections.splice(at, 0, moved);
    return { ...page, sections };
  });
}

function cloneSection(section: Section): Section {
  const copy = structuredClone(section);
  copy.id = createId("sec");
  if (copy.type === "freeform") {
    copy.items = copy.items.map((item) => ({ ...item, id: createId("item") }));
  }
  if (copy.type === "preset" && copy.overlay) {
    copy.overlay = copy.overlay.map((item) => ({ ...item, id: createId("item") }));
  }
  return copy;
}

export function duplicateSection(site: SiteDraft, route: string, sectionId: string): SiteDraft {
  return mapPage(site, route, (page) => {
    const index = page.sections.findIndex((section) => section.id === sectionId);
    const section = page.sections[index];
    if (!section || page.locked || (section.type === "preset" && section.providerLocked) || section.type === "designed") return page;
    const sections = page.sections.slice();
    sections.splice(index + 1, 0, cloneSection(section));
    return { ...page, sections };
  });
}

export function deleteSection(site: SiteDraft, route: string, sectionId: string): SiteDraft {
  return mapPage(site, route, (page) => {
    const section = page.sections.find((item) => item.id === sectionId);
    if (!section || page.locked || (section.type === "preset" && section.providerLocked) || section.type === "designed") return page;
    return { ...page, sections: page.sections.filter((item) => item.id !== sectionId) };
  });
}

export function setSectionHidden(site: SiteDraft, route: string, sectionId: string, hidden: boolean): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    if (section.type === "preset" && section.providerLocked) return section;
    return { ...section, hidden };
  });
}

function setField(section: Section, field: string, value: string): Section {
  if (field.startsWith("items.")) {
    const [, indexText, key] = field.split(".");
    const index = Number(indexText);
    if (section.type === "features" && (key === "title" || key === "body")) {
      const items = section.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item));
      return { ...section, items };
    }
    if (section.type === "faq" && (key === "q" || key === "a")) {
      const items = section.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item));
      return { ...section, items };
    }
    if (section.type === "gallery" && key === "alt") {
      const images = section.images.map((item, itemIndex) => (itemIndex === index ? { ...item, alt: value } : item));
      return { ...section, images };
    }
    return section;
  }
  if (field === "listItem" && section.type === "paragraph") return section;
  return { ...section, [field]: value } as Section;
}

export function applyText(site: SiteDraft, route: string, sectionId: string, field: string, value: string, itemId?: string): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    if (section.type === "preset" && section.providerLocked) return section;
    if (itemId && section.type === "freeform") {
      return {
        ...section,
        items: section.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
      };
    }
    if (itemId && section.type === "preset" && section.overlay) {
      return {
        ...section,
        overlay: section.overlay.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
      };
    }
    return setField(section, field, value);
  });
}

export function addZoneItem(site: SiteDraft, route: string, sectionId: string, kind: FreeformItem["kind"], overlay = false): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    if (overlay && section.type === "preset") {
      const overlayItems = section.overlay ?? [];
      return { ...section, overlay: [...overlayItems, createFreeformItem(kind, overlayItems.length)] };
    }
    if (section.type !== "freeform") return section;
    return { ...section, items: [...section.items, createFreeformItem(kind, section.items.length)] };
  });
}

function viewportKey(viewport: "desktop" | "tablet" | "mobile") {
  return viewport;
}

export function placeItems(
  site: SiteDraft,
  route: string,
  sectionId: string,
  viewport: "desktop" | "tablet" | "mobile",
  placements: { id: string; placement: Placement }[],
  overlay = false,
): SiteDraft {
  const key = viewportKey(viewport);
  const apply = (items: FreeformItem[]) =>
    items.map((item) => {
      const next = placements.find((entry) => entry.id === item.id);
      if (!next) return item;
      return { ...item, [key]: clampPlacement(next.placement) };
    });
  return mapSection(site, route, sectionId, (section) => {
    if (overlay && section.type === "preset") return { ...section, overlay: apply(section.overlay ?? []) };
    if (section.type !== "freeform") return section;
    return { ...section, items: apply(section.items) };
  });
}

export function alignItems(
  site: SiteDraft,
  route: string,
  sectionId: string,
  itemIds: string[],
  viewport: "desktop" | "tablet" | "mobile",
  mode: "left" | "center" | "right" | "top" | "middle",
  overlay = false,
): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    const source = overlay && section.type === "preset" ? section.overlay ?? [] : section.type === "freeform" ? section.items : null;
    if (!source) return section;
    const chosen = source.filter((item) => itemIds.includes(item.id));
    const boxes = chosen.map((item) => item[viewport] ?? item.desktop);
    if (boxes.length === 0) return section;
    const minX = Math.min(...boxes.map((box) => box.x));
    const maxRight = Math.max(...boxes.map((box) => box.x + box.w));
    const minY = Math.min(...boxes.map((box) => box.y));
    const maxBottom = Math.max(...boxes.map((box) => box.y + box.h));
    const midX = boxes.length === 1 ? 0.5 : (minX + maxRight) / 2;
    const midY = boxes.length === 1 ? 0.5 : (minY + maxBottom) / 2;
    const items = source.map((item) => {
      if (!itemIds.includes(item.id)) return item;
      const box = { ...(item[viewport] ?? item.desktop) };
      if (mode === "left") box.x = boxes.length === 1 ? 0 : minX;
      if (mode === "right") box.x = (boxes.length === 1 ? 1 : maxRight) - box.w;
      if (mode === "center") box.x = midX - box.w / 2;
      if (mode === "top") box.y = boxes.length === 1 ? 0 : minY;
      if (mode === "middle") box.y = midY - box.h / 2;
      return { ...item, [viewport]: clampPlacement(box) };
    });
    if (overlay && section.type === "preset") return { ...section, overlay: items };
    if (section.type === "freeform") return { ...section, items };
    return section;
  });
}

export function groupItems(site: SiteDraft, route: string, sectionId: string, itemIds: string[], overlay = false): SiteDraft {
  const groupId = createId("grp");
  return mapSection(site, route, sectionId, (section) => {
    const apply = (items: FreeformItem[]) => {
      const selected = items.filter((item) => itemIds.includes(item.id));
      const shared = selected.every((item) => item.groupId && item.groupId === selected[0]?.groupId);
      return items.map((item) => {
        if (!itemIds.includes(item.id)) return item;
        if (shared) {
          const next = { ...item };
          delete next.groupId;
          return next;
        }
        return { ...item, groupId };
      });
    };
    if (overlay && section.type === "preset") return { ...section, overlay: apply(section.overlay ?? []) };
    if (section.type !== "freeform") return section;
    return { ...section, items: apply(section.items) };
  });
}

export function patchItem(site: SiteDraft, route: string, sectionId: string, itemId: string, patch: Partial<FreeformItem>, overlay = false): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    const apply = (items: FreeformItem[]) => items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
    if (overlay && section.type === "preset") return { ...section, overlay: apply(section.overlay ?? []) };
    if (section.type !== "freeform") return section;
    return { ...section, items: apply(section.items) };
  });
}

export function duplicateItem(site: SiteDraft, route: string, sectionId: string, itemId: string, overlay = false): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    const apply = (items: FreeformItem[]) => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) return items;
      const copy: FreeformItem = {
        ...structuredClone(item),
        id: createId("item"),
        desktop: clampPlacement({ ...item.desktop, x: Math.min(0.9, item.desktop.x + 0.04), y: Math.min(0.9, item.desktop.y + 0.04) }),
      };
      return [...items, copy];
    };
    if (overlay && section.type === "preset") return { ...section, overlay: apply(section.overlay ?? []) };
    if (section.type !== "freeform") return section;
    return { ...section, items: apply(section.items) };
  });
}

export function deleteItem(site: SiteDraft, route: string, sectionId: string, itemId: string, overlay = false): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    if (overlay && section.type === "preset") return { ...section, overlay: (section.overlay ?? []).filter((item) => item.id !== itemId) };
    if (section.type !== "freeform") return section;
    return { ...section, items: section.items.filter((item) => item.id !== itemId) };
  });
}

export function renameZone(site: SiteDraft, route: string, sectionId: string, name: string): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    if (section.type === "freeform") return { ...section, name };
    if (section.type === "preset") return { ...section, overlayName: name };
    return section;
  });
}

export function setImageSource(site: SiteDraft, route: string, sectionId: string, src: string, alt: string, itemId?: string): SiteDraft {
  return mapSection(site, route, sectionId, (section) => {
    if (itemId && section.type === "freeform") {
      return { ...section, items: section.items.map((item) => (item.id === itemId ? { ...item, src, alt: alt || item.alt } : item)) };
    }
    if (itemId && section.type === "preset") {
      return { ...section, overlay: (section.overlay ?? []).map((item) => (item.id === itemId ? { ...item, src, alt: alt || item.alt } : item)) };
    }
    if (section.type === "image") return { ...section, src, alt: alt || section.alt };
    if (section.type === "preset" && section.heroImage) return { ...section, heroImage: { ...section.heroImage, src, alt: alt || section.heroImage.alt } };
    if (section.type === "gallery") return { ...section, images: [...section.images, { src, alt }] };
    return section;
  });
}

const RESERVED = new Set(["/", "/about", "/approach", "/solutions", "/team", "/references", "/insights", "/contact", "/privacy", "/terms", "/prototype-notes"]);

export function slugify(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "page";
}

export function createPage(
  site: SiteDraft,
  input: { title: string; route: string; template: PageDocument["template"]; navVisible: boolean; seoTitle: string; metaDescription: string },
): { site: SiteDraft; error?: string } {
  const route = input.route.startsWith("/") ? input.route : `/${input.route}`;
  if (!/^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route)) return { site, error: "Use a short address such as /new-service." };
  if (RESERVED.has(route) || site.pages.some((page) => page.route === route)) return { site, error: "That address is already used." };
  if (input.template === "home" || input.template === "marketing" || input.template === "legal") return { site, error: "Choose a starting layout." };
  const next: PageDocument = {
    id: createId("page"),
    route,
    title: input.title.trim() || "New page",
    template: input.template,
    navVisible: input.navVisible,
    archived: false,
    locked: false,
    seoTitle: input.seoTitle,
    metaDescription: input.metaDescription,
    sections: templateSections(input.template),
  };
  return { site: { ...site, pages: [...site.pages, next] }, error: undefined };
}

export function duplicatePage(site: SiteDraft, route: string): { site: SiteDraft; route?: string; error?: string } {
  const page = pageByRoute(site, route);
  if (!page || page.locked || page.route === "/") return { site, error: "This page cannot be duplicated." };
  let copyRoute = `${page.route}-copy`;
  let n = 2;
  while (site.pages.some((item) => item.route === copyRoute) || RESERVED.has(copyRoute)) {
    copyRoute = `${page.route}-copy-${n}`;
    n += 1;
  }
  const copy: PageDocument = {
    ...structuredClone(page),
    id: createId("page"),
    route: copyRoute,
    title: `${page.title} copy`,
    template: page.template === "marketing" || page.template === "legal" || page.template === "home" ? "landing" : page.template,
    archived: false,
    locked: false,
    navVisible: false,
    sections: page.sections.filter((section) => section.type !== "designed").map(cloneSection),
  };
  if (copy.sections.length === 0) copy.sections = templateSections("landing");
  return { site: { ...site, pages: [...site.pages, copy] }, route: copyRoute };
}

export function setArchived(site: SiteDraft, route: string, archived: boolean): SiteDraft {
  if (route === "/") return site;
  return mapPage(site, route, (page) => (page.locked ? page : { ...page, archived, navVisible: archived ? false : page.navVisible }));
}

export function setNavVisible(site: SiteDraft, route: string, navVisible: boolean): SiteDraft {
  return mapPage(site, route, (page) => ({ ...page, navVisible }));
}

export function updatePageMeta(site: SiteDraft, route: string, patch: Partial<Pick<PageDocument, "title" | "seoTitle" | "metaDescription" | "navVisible">>): SiteDraft {
  return mapPage(site, route, (page) => ({ ...page, ...patch }));
}

export function saveSectionTemplate(site: SiteDraft, route: string, sectionId: string, name: string): SiteDraft {
  const section = pageByRoute(site, route)?.sections.find((item) => item.id === sectionId);
  if (!section || section.type === "designed" || section.type === "embed") return site;
  if (section.type === "preset" && section.providerLocked) return site;
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return site;
  return {
    ...site,
    sectionTemplates: [...site.sectionTemplates, { id: createId("tpl"), name: trimmed, section: cloneSection(section) }],
  };
}

export function librarySection(type: LibraryBlock, canEmbed: boolean): Section | null {
  if (type === "embed" && !canEmbed) return null;
  return createSection(type);
}

export function collectMedia(value: unknown, found = new Set<string>()) {
  if (typeof value === "string" && value.startsWith("/media/")) found.add(value.slice("/media/".length));
  else if (Array.isArray(value)) value.forEach((entry) => collectMedia(entry, found));
  else if (value && typeof value === "object") Object.values(value).forEach((entry) => collectMedia(entry, found));
  return found;
}

export function imageUsage(site: SiteDraft, posts: BlogDraft[], filename: string): string[] {
  const needle = `/media/${filename}`;
  const names: string[] = [];
  for (const page of site.pages) {
    for (const section of page.sections) {
      const blob = JSON.stringify(section);
      if (!blob.includes(needle)) continue;
      if (section.type === "preset" && section.preset === "hero") names.push("Homepage hero");
      else if (section.type === "freeform") names.push(`${page.title}, ${section.name}`);
      else if (section.type === "preset" && section.overlayName) names.push(`${page.title}, ${section.overlayName}`);
      else names.push(`${page.title}${section.type === "image" ? "" : ""}`.trim());
    }
  }
  for (const post of posts) {
    if (JSON.stringify(post).includes(needle)) names.push(`Insights, ${post.title}`);
  }
  return [...new Set(names)];
}

export function changeLines(site: SiteDraft, posts: BlogDraft[]) {
  const lines: string[] = [];
  for (const page of site.pages) {
    if (page.archived) lines.push(`${page.title} is archived and stays off the public site after review.`);
    else if (page.template !== "home" && page.template !== "marketing" && page.template !== "legal") lines.push(`Page: ${page.title} (${page.route})`);
  }
  const hero = site.pages.find((page) => page.route === "/")?.sections.find((section) => section.type === "preset" && section.preset === "hero");
  if (hero && hero.type === "preset" && hero.tagline) lines.push(`Heading: ${hero.tagline}`);
  for (const post of posts) {
    lines.push(`Insights draft: ${post.title}`);
    if (post.publishAt) {
      lines.push(`Requested publish time for “${post.title}”: ${post.publishAt}. The live website still changes only after this review is merged.`);
    }
  }
  return lines.join("\n");
}
