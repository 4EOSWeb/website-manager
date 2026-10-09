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
  { type: "form", label: "Contact form" },
  { type: "freeform", label: "Freeform zone" },
  { type: "embed", label: "Embed" },
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

function preset(
  id: string,
  presetName: Extract<Section, { type: "preset" }>["preset"],
  fields: Partial<Extract<Section, { type: "preset" }>> = {},
): Section {
  return {
    id,
    type: "preset",
    hidden: false,
    preset: presetName,
    providerLocked: presetName === "formula",
    ...fields,
  };
}

function designed(title: string, lead: string): Section {
  return { id: "designed", type: "designed", hidden: false, title, lead };
}

function page(input: Omit<PageDocument, "seoTitle" | "metaDescription" | "archived" | "locked"> & Partial<PageDocument>): PageDocument {
  return {
    seoTitle: input.title,
    metaDescription: "",
    archived: false,
    locked: false,
    ...input,
  };
}

export function defaultSiteDraft(): SiteDraft {
  return {
    version: 2,
    sectionTemplates: [],
    pages: [
      page({
        id: "page_home",
        route: "/",
        title: "Home",
        template: "home",
        navVisible: true,
        sections: [
          preset("hero", "hero", {
            tagline: defaultHomeDraft.tagline,
            positioning: defaultHomeDraft.positioning,
            buttonLabel: defaultHomeDraft.primaryButton.label,
            buttonHref: defaultHomeDraft.primaryButton.href,
            heroImage: emptyImage(),
            overlayName: "Hero callouts",
            overlay: [],
          }),
          preset("audience", "audience", { heading: "Who we work with" }),
          preset("who", "who", { heading: "An agile, responsive ally — an extension of your team" }),
          preset("solutions", "solutions", {
            heading: "Six solution areas, one collaborative team",
            body: "Comprehensive marketing solutions for healthcare organizations, combined around what you need now.",
          }),
          preset("formula", "formula", { providerLocked: true }),
          preset("team", "team", { heading: "Experts in senior care marketing" }),
          preset("references", "references", { heading: "What our clients say" }),
          preset("insights", "insights", { heading: "Writing on senior care, aging services and B2B marketing" }),
          preset("cta", "cta", {
            heading: "Ready to accelerate your growth?",
            body: "Let's collaborate to elevate your strategy and achieve measurable results.",
          }),
        ],
      }),
      page({
        id: "page_solutions",
        route: "/solutions",
        title: "Solutions",
        template: "marketing",
        navVisible: false,
        sections: [
          designed(
            "Comprehensive marketing solutions, tailored to your goals",
            "Six solution areas for healthcare and senior care organizations. Flexible solutions that meet you where you are, from launching something new to getting more from what you already have.",
          ),
        ],
      }),
      page({
        id: "page_approach",
        route: "/approach",
        title: "Approach",
        template: "marketing",
        navVisible: false,
        sections: [
          designed(
            "Helping you achieve your goals.",
            "We collaborate with you to understand your goals, prioritize what matters most, and deliver measurable results that move your organization forward.",
          ),
        ],
      }),
      page({
        id: "page_about",
        route: "/about",
        title: "About",
        template: "marketing",
        navVisible: false,
        sections: [
          designed(
            "Build. Grow. Achieve. Maximize. Influence.",
            "Mobilizing leading experts to help healthcare organizations focused on growth achieve their goals.",
          ),
        ],
      }),
      page({
        id: "page_team",
        route: "/team",
        title: "Team",
        template: "marketing",
        navVisible: false,
        sections: [
          designed(
            "Experts in senior care marketing",
            "Our collaborative team brings together experts with 20-35+ years of experience in healthcare marketing, senior living operations, content development, technology, and strategic advisory.",
          ),
        ],
      }),
      page({
        id: "page_references",
        route: "/references",
        title: "References",
        template: "marketing",
        navVisible: false,
        sections: [
          designed(
            "Trusted by leading healthcare organizations",
            "What clients have said about working with us, and the kinds of organizations we serve.",
          ),
        ],
      }),
      page({
        id: "page_insights",
        route: "/insights",
        title: "Insights",
        template: "marketing",
        navVisible: false,
        sections: [
          designed(
            "Insights that drive growth",
            "Market intelligence, strategic playbooks, and proven tactics for the longevity economy.",
          ),
        ],
      }),
      page({
        id: "page_contact",
        route: "/contact",
        title: "Contact",
        template: "marketing",
        navVisible: false,
        sections: [
          designed(
            "Let's collaborate",
            "Helping you thrive in the longevity economy like never before. Ready to accelerate your growth? We're here to help.",
          ),
        ],
      }),
      page({
        id: "page_privacy",
        route: "/privacy",
        title: "Privacy",
        template: "legal",
        navVisible: false,
        locked: true,
        sections: [],
      }),
      page({
        id: "page_terms",
        route: "/terms",
        title: "Terms",
        template: "legal",
        navVisible: false,
        locked: true,
        sections: [],
      }),
    ],
  };
}

function withText(type: "heading" | "paragraph", text: string): Section {
  const section = createSection(type);
  if (section.type === "heading" || section.type === "paragraph") return { ...section, text };
  return section;
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

export function normalizeSiteDraft(data: unknown): SiteDraft {
  const cleaned = stripCopper(data);
  const parsed = siteDraftSchema.safeParse(cleaned);
  if (parsed.success) return parsed.data;
  return migrateHomeDraft(cleaned) ?? defaultSiteDraft();
}

export function heroFields(site: SiteDraft) {
  const home = site.pages.find((item) => item.route === "/");
  const hero = home?.sections.find((section) => section.type === "preset" && section.preset === "hero");
  if (!hero || hero.type !== "preset") return defaultHomeDraft;
  return {
    tagline: hero.tagline || defaultHomeDraft.tagline,
    positioning: hero.positioning || defaultHomeDraft.positioning,
    primaryButton: {
      label: hero.buttonLabel || defaultHomeDraft.primaryButton.label,
      href: hero.buttonHref || defaultHomeDraft.primaryButton.href,
    },
    heroImage: hero.heroImage?.src ? hero.heroImage : emptyImage(),
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
