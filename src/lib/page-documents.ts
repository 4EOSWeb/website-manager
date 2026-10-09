import {
  COPPER_TEST_IMAGE,
  type FreeformItem,
  type PageDocument,
  type Placement,
  type Section,
  type SiteDraft,
  defaultHomeDraft,
  homeDraftSchema,
  siteDraftSchema,
} from "./content-schema";
import { defaultSiteDocument, upgradeDraft } from "./flow-seed";
import { sanitizeMarks } from "./rich-text";

export function createId(prefix: string) {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(4));
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

export const LIBRARY_BLOCKS = [
  { type: "text", label: "Text" },
  { type: "heading", label: "Heading" },
  { type: "paragraph", label: "Paragraph" },
  { type: "button", label: "Button" },
  { type: "image", label: "Image" },
  { type: "gallery", label: "Gallery" },
  { type: "divider", label: "Divider" },
  { type: "spacer", label: "Spacer" },
  { type: "quote", label: "Quote" },
  { type: "video", label: "Video" },
  { type: "cta", label: "Call to action" },
  { type: "card", label: "Card" },
  { type: "features", label: "Feature section" },
  { type: "faq", label: "FAQ" },
  { type: "testimonial", label: "Testimonial" },
  { type: "form", label: "Form" },
  { type: "freeform", label: "Freeform zone" },
  { type: "embed", label: "Embed" },
  { type: "audio", label: "Audio" },
  { type: "line", label: "Line" },
  { type: "map", label: "Map" },
  { type: "search", label: "Search" },
  { type: "newsletter", label: "Newsletter" },
  { type: "social", label: "Social links" },
  { type: "insights-summary", label: "Summary" },
] as const;

export type LibraryBlock = (typeof LIBRARY_BLOCKS)[number]["type"];

const ZONE_KINDS = new Set(["text", "heading", "image", "button", "callout", "testimonial", "promo", "graphic"]);

export function blockFitsInZone(type: string) {
  if (type === "paragraph") return "text";
  if (type === "cta") return "promo";
  if (ZONE_KINDS.has(type)) return type;
  return null;
}

function emptyImage() {
  return { ...defaultHomeDraft.heroImage };
}

export function createSection(type: LibraryBlock, name = "Freeform zone"): Section {
  const id = createId("sec");
  const hidden = false;
  switch (type) {
    case "text":
      return { id, type, hidden, text: "" };
    case "heading":
      return { id, type, hidden, text: "Add a heading", level: 2 };
    case "paragraph":
      return { id, type, hidden, text: "" };
    case "button":
      return { id, type, hidden, label: "Learn more", href: "/contact" };
    case "image":
      return { id, type, hidden, src: "", alt: "", caption: "" };
    case "gallery":
      return { id, type, hidden, images: [] };
    case "divider":
      return { id, type, hidden };
    case "spacer":
      return { id, type, hidden, size: "m" };
    case "quote":
      return { id, type, hidden, text: "", cite: "" };
    case "video":
      return { id, type, hidden, url: "" };
    case "cta":
      return { id, type, hidden, heading: "Ready to talk?", body: "Tell visitors what happens next.", label: "Start a conversation", href: "/contact" };
    case "card":
      return { id, type, hidden, heading: "A short point", body: "" };
    case "features":
      return { id, type, hidden, heading: "What you can expect", items: [{ title: "First point", body: "" }, { title: "Second point", body: "" }] };
    case "faq":
      return { id, type, hidden, heading: "", items: [] };
    case "testimonial":
      return { id, type, hidden, quote: "", name: "", role: "" };
    case "form":
      return { id, type, hidden, nameLabel: "Name", emailLabel: "Email", messageLabel: "Message", buttonLabel: "Send" };
    case "freeform":
      return { id, type, hidden, name, items: [] };
    case "embed":
      return { id, type, hidden, title: "Embedded page", url: "https://example.com" };
    case "audio":
      return { id, type, hidden, src: "", label: "Listen" };
    case "line":
      return { id, type, hidden };
    case "map":
      return { id, type, hidden, address: "" };
    case "search":
      return { id, type, hidden, label: "Search this site" };
    case "newsletter":
      return { id, type, hidden, heading: "Get the next note", buttonLabel: "Sign up", recipient: "" };
    case "social":
      return { id, type, hidden, links: [] };
    case "insights-summary":
      return { id, type, hidden, heading: "Latest insights" };
    default:
      return { id, type: "paragraph", hidden, text: "" };
  }
}

export function createFreeformItem(kind: FreeformItem["kind"], index: number): FreeformItem {
  const shift = (index % 5) * 0.06;
  return {
    id: createId("item"),
    kind,
    hidden: false,
    locked: false,
    zIndex: index + 1,
    text: kind === "heading" ? "Heading" : kind === "button" ? "Learn more" : "",
    href: kind === "button" ? "/contact" : undefined,
    src: "",
    alt: "",
    caption: "",
    desktop: { x: 0.08 + shift, y: 0.08 + shift, w: kind === "image" || kind === "graphic" ? 0.36 : 0.42, h: 0.28 },
  };
}

export function defaultSiteDraft(): SiteDraft {
  return defaultSiteDocument();
}


function withText(type: "heading" | "paragraph", text: string): Section {
  const section = createSection(type);
  if (section.type === "heading" || section.type === "paragraph") return { ...section, text };
  return section;
}

export function catalogSection(layout: "hero" | "split" | "cards" | "list" | "stack"): Section {
  const id = createId("sec");
  const blocks: Extract<Section, { type: "flow" }>["blocks"] = [
    { id: createId("blk"), kind: "heading", hidden: false, text: { text: layout === "hero" ? "Add a heading" : "A new section", marks: [] } },
    { id: createId("blk"), kind: "paragraph", hidden: false, text: { text: "Click to add content", marks: [] } },
  ];
  if (layout === "cards" || layout === "list") {
    blocks.push({ id: createId("blk"), kind: "card", hidden: false, text: { text: "First point", marks: [] } });
  }
  return { id, type: "flow", hidden: false, editorName: "Section", layout, blocks };
}

export function templateSections(template: PageDocument["template"]): Section[] {
  if (template === "landing") {
    return [
      createSection("heading"),
      withText("paragraph", "Tell visitors who this is for and what they can do next."),
      createSection("image"),
      createSection("cta"),
    ];
  }
  if (template === "service") {
    return [createSection("heading"), createSection("features"), createSection("faq"), createSection("cta")];
  }
  if (template === "resource") {
    return [createSection("heading"), withText("paragraph", "Summarize the resource in a few sentences."), createSection("quote")];
  }
  if (template === "insights-landing") {
    return [withText("heading", "Insights"), withText("paragraph", "Introduce the latest writing from your team."), createSection("image")];
  }
  return [withText("heading", "New page"), createSection("paragraph")];
}

function stripCopper(value: unknown): unknown {
  if (typeof value === "string") return value === COPPER_TEST_IMAGE ? "" : value;
  if (Array.isArray(value)) return value.map(stripCopper);
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) next[key] = stripCopper(entry);
    return next;
  }
  return value;
}

function migrateHomeDraft(data: unknown): SiteDraft | null {
  const parsed = homeDraftSchema.safeParse(data);
  if (!parsed.success) return null;
  const site = defaultSiteDraft();
  const home = site.pages[0];
  const hero = home?.sections.find((section) => section.type === "preset" && section.preset === "hero");
  if (home && hero && hero.type === "preset") {
    const image = parsed.data.heroImage.src === COPPER_TEST_IMAGE ? emptyImage() : parsed.data.heroImage;
    home.sections[0] = {
      ...hero,
      tagline: parsed.data.tagline,
      positioning: parsed.data.positioning,
      buttonLabel: parsed.data.primaryButton.label,
      buttonHref: parsed.data.primaryButton.href,
      heroImage: image.src ? image : emptyImage(),
    };
  }
  return site;
}

function sanitizeRich(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeRich);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) next[key] = sanitizeRich(entry);
  if (typeof next.text === "string" && Array.isArray(record.marks)) {
    next.marks = sanitizeMarks(next.text, record.marks as Parameters<typeof sanitizeMarks>[1]);
  }
  return next;
}

export function normalizeSiteDraft(data: unknown): SiteDraft {
  const cleaned = sanitizeRich(stripCopper(upgradeDraft(data)));
  const parsed = siteDraftSchema.safeParse(cleaned);
  if (parsed.success) return parsed.data;
  return migrateHomeDraft(cleaned) ?? defaultSiteDraft();
}

export function heroFields(site: SiteDraft) {
  const home = site.pages.find((item) => item.route === "/");
  const flow = home?.sections.find((section) => section.type === "flow" && section.layout === "hero");
  const preset = home?.sections.find((section) => section.type === "preset" && section.preset === "hero");
  if (flow && flow.type === "flow") {
    const heading = flow.blocks.find((item) => item.kind === "heading");
    const paragraph = flow.blocks.find((item) => item.kind === "paragraph");
    const button = flow.blocks.find((item) => item.kind === "button");
    const image = flow.blocks.find((item) => item.kind === "image" && item.src);
    return {
      tagline: (typeof heading?.text === "object" ? heading.text.text : "") || defaultHomeDraft.tagline,
      positioning: (typeof paragraph?.text === "object" ? paragraph.text.text : "") || defaultHomeDraft.positioning,
      primaryButton: {
        label: (typeof button?.text === "object" ? button.text.text : "") || defaultHomeDraft.primaryButton.label,
        href: button?.href || defaultHomeDraft.primaryButton.href,
      },
      heroImage: image?.src ? { ...emptyImage(), src: image.src, alt: image.alt ?? "" } : emptyImage(),
    };
  }
  if (!preset || preset.type !== "preset") return defaultHomeDraft;
  return {
    tagline: preset.tagline || defaultHomeDraft.tagline,
    positioning: preset.positioning || defaultHomeDraft.positioning,
    primaryButton: {
      label: preset.buttonLabel || defaultHomeDraft.primaryButton.label,
      href: preset.buttonHref || defaultHomeDraft.primaryButton.href,
    },
    heroImage: preset.heroImage?.src ? preset.heroImage : emptyImage(),
  };
}

export function clampPlacement(placement: Placement): Placement {
  const round = (value: number) => Math.min(1, Math.max(0, Math.round(value * 1000) / 1000));
  return {
    x: round(placement.x),
    y: round(placement.y),
    w: Math.min(1, Math.max(0.05, round(placement.w))),
    h: Math.min(1, Math.max(0.05, round(placement.h))),
  };
}

export function stripEmbeds(site: SiteDraft, canEmbed: boolean): SiteDraft {
  if (canEmbed) return site;
  return {
    ...site,
    pages: site.pages.map((item) => ({
      ...item,
      sections: item.sections.filter((section) => section.type !== "embed"),
    })),
    sectionTemplates: site.sectionTemplates.filter((item) => item.section.type !== "embed"),
  };
}
