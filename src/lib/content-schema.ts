import { z } from "zod";

const internalPath = z
  .string()
  .regex(/^\/[a-z0-9/-]*$/, "Use a path on this website, such as /contact.");

const mediaPath = z
  .string()
  .regex(/^$|^\/media\/[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp)$/i, "Choose an image from this website's library.");

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
