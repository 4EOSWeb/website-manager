import { z } from "zod";

const internalPath = z
  .string()
  .regex(/^\/[a-z0-9/-]*$/, "Use a path on this website, such as /contact.");

const mediaPath = z
  .string()
  .regex(/^$|^\/media\/[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|svg)$/i, "Choose an image from this website's library.");

export const heroImageSchema = z.object({
  src: mediaPath,
  alt: z.string().max(200),
  placement: z.enum(["with-copy", "beside-mark"]),
  align: z.enum(["start", "end"]),
  width: z.enum(["narrow", "medium", "wide"]),
  aspect: z.enum(["auto", "square", "landscape"]),
  focal: z.enum(["center", "top", "bottom", "left", "right"]),
});

export const homeDraftSchema = z
  .object({
    tagline: z.string().trim().min(1, "Add a heading.").max(160),
    positioning: z.string().trim().min(1, "Add a paragraph.").max(400),
    primaryButton: z.object({
      label: z.string().trim().min(1, "Add a button label.").max(60),
      href: internalPath,
    }),
    heroImage: heroImageSchema,
  })
  .superRefine((value, ctx) => {
    if (value.heroImage.src && value.heroImage.alt.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["heroImage", "alt"],
        message: "Describe the image for people who cannot see it.",
      });
    }
  });

export type HomeDraft = z.infer<typeof homeDraftSchema>;

export const blogBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string().max(4000) }),
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().max(200),
  }),
  z.object({ type: z.literal("quote"), text: z.string().max(1000) }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.string().max(500)).max(20),
  }),
  z.object({
    type: z.literal("table"),
    headers: z.array(z.string().max(80)).min(1).max(6),
    rows: z.array(z.array(z.string().max(200)).max(6)).max(20),
  }),
  z.object({ type: z.literal("image"), src: mediaPath, alt: z.string().max(200) }),
  z.object({ type: z.literal("link"), href: internalPath, label: z.string().max(120) }),
]);

export const blogDraftSchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.")
    .max(80),
  excerpt: z.string().trim().max(300),
  authorDisplayName: z.string().trim().min(1).max(80),
  seoTitle: z.string().trim().max(70),
  metaDescription: z.string().trim().max(160),
  blocks: z.array(blogBlockSchema).min(1).max(40),
  featuredImage: z
    .object({
      src: mediaPath,
      alt: z.string().max(200),
    })
    .nullable(),
  publishAt: z.string().max(40).optional(),
});

export type BlogDraft = z.infer<typeof blogDraftSchema>;

export const defaultHomeDraft: HomeDraft = {
  tagline: "Elevate strategy. Accelerate growth.",
  positioning:
    "The only marketing firm in senior care steeped in both consumer and business-to-business.",
  primaryButton: { label: "Start a conversation", href: "/contact" },
  heroImage: {
    src: "",
    alt: "",
    placement: "with-copy",
    align: "start",
    width: "medium",
    aspect: "auto",
    focal: "center",
  },
};

export const defaultBlogDraft: BlogDraft = {
  title: "A note from the team",
  slug: "a-note-from-the-team",
  excerpt: "A short update for readers of Insights.",
  authorDisplayName: "Quantum Age",
  seoTitle: "A note from the team",
  metaDescription: "A short update for readers of Insights.",
  blocks: [
    {
      type: "paragraph",
      text: "Write the first paragraph here. This draft is not on the live website until it is reviewed and published.",
    },
  ],
  featuredImage: null,
};

export function zodFieldErrors(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}

/** Leftover test image. It is not part of the Quantum Age design. */
export const COPPER_TEST_IMAGE = "/media/ee77ec25b974e4a0.png";

export const PROVIDER_LOCK_MESSAGE =
  "This item isn't typically editable through the website editor. Please contact your website provider if you need changes made to this section.";

export const SITE_AUTHORS = [
  "CC Andrews",
  "Edie Deane",
  "Tanya Hartsoe",
  "Wendy Bullard",
  "Louis Lenzmeier",
  "Joe Whitt",
  "Joanne Kaldy",
  "Jaret Andrews",
  "Meg LaPorte",
  "Quantum Age",
] as const;

const share = z.number().finite().min(0).max(1);
export const placementSchema = z
  .object({
    x: share,
    y: share,
    w: share,
    h: share,
  })
  .strict();

const blockId = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/);

const videoUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => value === "" || /^https:\/\/(www\.)?(youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+|vimeo\.com\/\d+)/.test(value),
    "Paste a YouTube or Vimeo link.",
  );

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const richMarkSchema = z
  .object({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
    kind: z.enum(["bold", "italic", "underline", "link", "color"]),
    href: z.string().max(300).optional(),
    color: hexColor.optional(),
  })
  .strict();

export const richTextSchema = z.preprocess(
  (value) => (typeof value === "string" ? { text: value, marks: [] } : value),
  z
    .object({
      text: z.string().max(4000),
      marks: z.array(richMarkSchema).max(40),
    })
    .strict(),
);

export const sectionStyleSchema = z
  .object({
    background: z.enum(["paper", "band", "ink", "image", "video"]).optional(),
    color: hexColor.optional(),
    image: mediaPath.optional(),
    video: videoUrl.optional(),
    overlay: z.number().min(0).max(1).optional(),
    padding: z.enum(["s", "m", "l"]).optional(),
    gap: z.enum(["none", "s", "m", "l"]).optional(),
    minHeight: z.enum(["auto", "quarter", "half", "full"]).optional(),
    border: z.boolean().optional(),
    shadow: z.boolean().optional(),
    width: z.enum(["content", "full"]).optional(),
    align: z.enum(["start", "center"]).optional(),
  })
  .strict();

const socialLinkSchema = z
  .object({
    label: z.string().max(40),
    href: z.string().max(300),
  })
  .strict();

export const textStyleSchema = z
  .object({
    preset: z.enum(["small", "body", "lead", "title", "display"]).optional(),
    tag: z.enum(["eyebrow", "h1", "h2", "h3", "p"]).optional(),
    weight: z.enum(["regular", "medium", "bold"]).optional(),
    leading: z.enum(["tight", "normal", "loose"]).optional(),
    tracking: z.enum(["tight", "normal", "wide"]).optional(),
    align: z.enum(["start", "center", "end"]).optional(),
    color: hexColor.optional(),
  })
  .strict();

export type TextStyle = z.infer<typeof textStyleSchema>;

export const flowBlockSchema = z
  .object({
    id: blockId,
    kind: z.enum(["eyebrow", "heading", "paragraph", "button", "image", "link", "list", "quote", "person", "card", "brand-mark", "insights"]),
    hidden: z.boolean(),
    editorName: z.string().max(80).optional(),
    text: richTextSchema.optional(),
    detail: richTextSchema.optional(),
    href: z.string().max(300).optional(),
    src: mediaPath.optional(),
    alt: z.string().max(200).optional(),
    locked: z.boolean().optional(),
    pin: z.boolean().optional(),
    zIndex: z.number().int().min(0).max(200).optional(),
    fit: z.enum(["fit", "fill"]).optional(),
    focal: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
    desktop: placementSchema.optional(),
    tablet: placementSchema.optional(),
    mobile: placementSchema.optional(),
    textStyle: textStyleSchema.optional(),
    variant: z.enum(["filled", "outline", "text"]).optional(),
    size: z.enum(["s", "m", "l"]).optional(),
    align: z.enum(["start", "center", "end"]).optional(),
    target: z.enum(["same", "new"]).optional(),
    icon: z.enum(["arrow", "none", "external", "mail", "phone"]).optional(),
    width: z.enum(["s", "m", "l", "full"]).optional(),
    listStyle: z.enum(["bullet", "number"]).optional(),
    hideOn: z.array(z.enum(["desktop", "tablet", "mobile"])).max(3).optional(),
  })
  .strict();

export const siteChromeSchema = z
  .object({
    header: z
      .object({
        logo: mediaPath,
        siteName: z.string().max(80),
        buttonLabel: z.string().max(60),
        buttonHref: z.string().max(300),
        sticky: z.boolean(),
        social: z.array(socialLinkSchema).max(8),
        hiddenOn: z.array(z.string().max(80)).max(40),
        phoneCompact: z.boolean(),
      })
      .strict(),
    footer: z
      .object({
        copyright: z.string().max(200),
        note: z.string().max(400),
        links: z.array(socialLinkSchema).max(16),
        contact: z.array(z.string().max(160)).max(6),
        social: z.array(socialLinkSchema).max(8),
        images: z.array(z.object({ src: mediaPath, alt: z.string().max(200) }).strict()).max(4),
      })
      .strict(),
    announcement: z
      .object({
        enabled: z.boolean(),
        text: z.string().max(200),
        href: z.string().max(300),
      })
      .strict(),
    profile: z
      .object({
        name: z.string().max(120),
        phone: z.string().max(40),
        email: z.string().max(120),
        address: z.string().max(240),
      })
      .strict(),
    theme: z
      .object({
        ink: hexColor,
        plum: hexColor,
        green: hexColor,
        paper: hexColor,
        font: z.enum(["serif", "sans"]),
        button: z.enum(["filled", "outline"]),
        spacing: z.enum(["compact", "comfortable", "roomy"]),
      })
      .strict(),
    favicon: mediaPath,
    cookieText: z.string().max(400),
    analyticsId: z.string().max(40).regex(/^[A-Za-z0-9-]*$/),
  })
  .strict();

export type Placement = z.infer<typeof placementSchema>;
export type RichTextValue = z.infer<typeof richTextSchema>;
export type FlowBlock = z.infer<typeof flowBlockSchema>;
export type SiteChrome = z.infer<typeof siteChromeSchema>;
export type SectionStyle = z.infer<typeof sectionStyleSchema>;

export const freeformItemSchema = z
  .object({
    id: blockId,
    kind: z.enum(["text", "heading", "image", "button", "callout", "testimonial", "promo", "graphic"]),
    hidden: z.boolean(),
    locked: z.boolean(),
    groupId: z.string().max(40).optional(),
    zIndex: z.number().int().min(0).max(200),
    text: z.string().max(4000).optional(),
    href: z.string().max(300).optional(),
    src: mediaPath.optional(),
    alt: z.string().max(200).optional(),
    caption: z.string().max(200).optional(),
    desktop: placementSchema,
    tablet: placementSchema.optional(),
    mobile: placementSchema.optional(),
  })
  .strict();

export type FreeformItem = z.infer<typeof freeformItemSchema>;

const sectionChrome = {
  editorName: z.string().max(80).optional(),
  layout: z.enum(["stack", "split", "grid", "hero", "band", "cards", "list", "quotes", "insights", "cta", "fluid"]).optional(),
  style: sectionStyleSchema.optional(),
  hideOn: z.array(z.enum(["desktop", "tablet", "mobile"])).max(3).optional(),
};
const sectionBase = { id: blockId, hidden: z.boolean(), ...sectionChrome };

export const sectionSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...sectionBase,
      type: z.literal("preset"),
      preset: z.enum(["hero", "audience", "who", "solutions", "formula", "team", "references", "insights", "cta"]),
      providerLocked: z.boolean(),
      tagline: z.string().max(160).optional(),
      positioning: z.string().max(400).optional(),
      buttonLabel: z.string().max(60).optional(),
      buttonHref: internalPath.optional(),
      heroImage: heroImageSchema.optional(),
      overlayName: z.string().max(80).optional(),
      overlay: z.array(freeformItemSchema).max(40).optional(),
      heading: z.string().max(200).optional(),
      body: z.string().max(2000).optional(),
    })
    .strict(),
  z.object({ ...sectionBase, type: z.literal("heading"), text: z.string().max(200), level: z.union([z.literal(2), z.literal(3)]) }).strict(),
  z.object({ ...sectionBase, type: z.literal("paragraph"), text: z.string().max(4000) }).strict(),
  z.object({ ...sectionBase, type: z.literal("text"), text: z.string().max(4000) }).strict(),
  z.object({ ...sectionBase, type: z.literal("button"), label: z.string().max(60), href: internalPath }).strict(),
  z.object({ ...sectionBase, type: z.literal("image"), src: mediaPath, alt: z.string().max(200), caption: z.string().max(200) }).strict(),
  z
    .object({
      ...sectionBase,
      type: z.literal("gallery"),
      images: z.array(z.object({ src: mediaPath, alt: z.string().max(200), caption: z.string().max(200).optional() }).strict()).max(24),
      layoutName: z.enum(["grid", "stack", "slideshow"]).optional(),
    })
    .strict(),
  z.object({ ...sectionBase, type: z.literal("divider") }).strict(),
  z.object({ ...sectionBase, type: z.literal("spacer"), size: z.enum(["s", "m", "l"]) }).strict(),
  z.object({ ...sectionBase, type: z.literal("quote"), text: z.string().max(1000), cite: z.string().max(120) }).strict(),
  z.object({ ...sectionBase, type: z.literal("video"), url: videoUrl }).strict(),
  z
    .object({
      ...sectionBase,
      type: z.literal("cta"),
      heading: z.string().max(160),
      body: z.string().max(400),
      label: z.string().max(60),
      href: internalPath,
    })
    .strict(),
  z.object({ ...sectionBase, type: z.literal("card"), heading: z.string().max(120), body: z.string().max(600) }).strict(),
  z
    .object({
      ...sectionBase,
      type: z.literal("features"),
      heading: z.string().max(160),
      items: z.array(z.object({ title: z.string().max(80), body: z.string().max(240) }).strict()).max(6),
    })
    .strict(),
  z
    .object({
      ...sectionBase,
      type: z.literal("faq"),
      heading: z.string().max(160),
      items: z.array(z.object({ q: z.string().max(200), a: z.string().max(800) }).strict()).max(12),
    })
    .strict(),
  z
    .object({
      ...sectionBase,
      type: z.literal("testimonial"),
      quote: z.string().max(600),
      name: z.string().max(80),
      role: z.string().max(80),
    })
    .strict(),
  z
    .object({
      ...sectionBase,
      type: z.literal("form"),
      nameLabel: z.string().max(40),
      emailLabel: z.string().max(40),
      messageLabel: z.string().max(40),
      buttonLabel: z.string().max(40),
      thankYou: z.string().max(200).optional(),
      recipient: z.string().max(120).optional(),
      fields: z
        .array(
          z
            .object({
              id: blockId,
              label: z.string().max(80),
              kind: z.enum(["text", "email", "textarea"]),
              required: z.boolean(),
            })
            .strict(),
        )
        .max(12)
        .optional(),
    })
    .strict(),
  z.object({ ...sectionBase, type: z.literal("freeform"), name: z.string().max(80), items: z.array(freeformItemSchema).max(40) }).strict(),
  z.object({ ...sectionBase, type: z.literal("embed"), title: z.string().max(120), url: z.string().trim().url().max(300) }).strict(),
  z.object({ ...sectionBase, type: z.literal("designed"), title: z.string().max(200), lead: z.string().max(800) }).strict(),
  z.object({ ...sectionBase, type: z.literal("flow"), blocks: z.array(flowBlockSchema).max(40) }).strict(),
  z.object({ ...sectionBase, type: z.literal("audio"), src: z.string().max(300), label: z.string().max(120) }).strict(),
  z.object({ ...sectionBase, type: z.literal("line") }).strict(),
  z.object({ ...sectionBase, type: z.literal("map"), address: z.string().max(240) }).strict(),
  z.object({ ...sectionBase, type: z.literal("search"), label: z.string().max(80) }).strict(),
  z.object({ ...sectionBase, type: z.literal("newsletter"), heading: z.string().max(160), buttonLabel: z.string().max(40), recipient: z.string().max(120) }).strict(),
  z
    .object({
      ...sectionBase,
      type: z.literal("social"),
      links: z.array(z.object({ label: z.string().max(40), href: z.string().max(300) }).strict()).max(8),
    })
    .strict(),
  z.object({ ...sectionBase, type: z.literal("insights-summary"), heading: z.string().max(160) }).strict(),
]);

export type Section = z.infer<typeof sectionSchema>;

const BUILT_IN_ROUTES = new Set([
  "/",
  "/about",
  "/approach",
  "/solutions",
  "/team",
  "/references",
  "/insights",
  "/contact",
  "/privacy",
  "/terms",
  "/prototype-notes",
]);

const CUSTOM_TEMPLATES = new Set(["blank", "landing", "service", "resource", "insights-landing"]);

export const pageDocumentSchema = z
  .object({
    id: blockId,
    route: z.string().regex(/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/, "Use a short address such as /new-service."),
    title: z.string().trim().min(1).max(80),
    template: z.enum(["home", "marketing", "legal", "blank", "landing", "service", "resource", "insights-landing"]),
    navVisible: z.boolean(),
    archived: z.boolean(),
    seoTitle: z.string().max(70),
    metaDescription: z.string().max(160),
    locked: z.boolean(),
    navLabel: z.string().max(80).optional(),
    parentRoute: z.string().max(80).optional(),
    shareImage: mediaPath.optional(),
    hideHeader: z.boolean().optional(),
    sections: z.array(sectionSchema).max(80),
  })
  .strict();

export type PageDocument = z.infer<typeof pageDocumentSchema>;

export const sectionTemplateSchema = z
  .object({
    id: blockId,
    name: z.string().trim().min(1).max(80),
    section: sectionSchema,
  })
  .strict();

export const siteDraftSchema = z
  .object({
    version: z.literal(3),
    chrome: siteChromeSchema,
    pages: z.array(pageDocumentSchema).min(1).max(40),
    sectionTemplates: z.array(sectionTemplateSchema).max(40),
  })
  .strict()
  .superRefine((site, ctx) => {
    const routes = new Set<string>();
    if (!site.pages.some((page) => page.route === "/")) {
      ctx.addIssue({ code: "custom", message: "The homepage is required." });
    }
    for (const page of site.pages) {
      if (routes.has(page.route)) ctx.addIssue({ code: "custom", message: "Two pages cannot share a web address." });
      routes.add(page.route);
      if (page.route === "/" && page.archived) ctx.addIssue({ code: "custom", message: "The homepage cannot be archived." });
      if (CUSTOM_TEMPLATES.has(page.template) && BUILT_IN_ROUTES.has(page.route)) {
        ctx.addIssue({ code: "custom", message: "That address is already used by this website." });
      }
      const ids = new Set<string>();
      for (const section of page.sections) {
        if (ids.has(section.id)) ctx.addIssue({ code: "custom", message: "Each section needs its own place on the page." });
        ids.add(section.id);
        if (section.type === "embed" && !section.url.startsWith("https://")) {
          ctx.addIssue({ code: "custom", message: "An embed needs an https link." });
        }
        if (section.type === "freeform") {
          const itemIds = new Set<string>();
          for (const item of section.items) {
            if (itemIds.has(item.id)) ctx.addIssue({ code: "custom", message: "Each item in a zone needs its own place." });
            itemIds.add(item.id);
          }
        }
      }
    }
  });

export type SiteDraft = z.infer<typeof siteDraftSchema>;
export type SectionTemplate = z.infer<typeof sectionTemplateSchema>;
