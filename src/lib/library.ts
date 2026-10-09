import type { FlowBlock, Section } from "@/lib/content-schema";
import { catalogSection, createId, createSection, type LibraryBlock } from "@/lib/page-documents";

export type LibraryCategory = "Sections" | "Text" | "Media" | "Buttons and links" | "Layout" | "Forms" | "Business" | "Social" | "Blog";

export type LibraryEntry = {
  id: string;
  label: string;
  description: string;
  category: LibraryCategory;
  keywords: string;
  thumb: "hero" | "split" | "cards" | "faq" | "quote" | "cta" | "form" | "blank" | "heading" | "text" | "list" | "button" | "image" | "gallery" | "video" | "divider" | "spacer" | "map" | "social" | "zone" | "embed" | "audio" | "search" | "newsletter" | "summary" | "card";
  block?: FlowBlock["kind"];
  embed?: boolean;
};

export const LIBRARY: LibraryEntry[] = [
  { id: "layout:hero", label: "Hero", description: "Big heading, a sentence, and a button", category: "Sections", keywords: "banner top intro welcome", thumb: "hero" },
  { id: "layout:split", label: "Text beside an image", description: "Two columns: words and a picture", category: "Sections", keywords: "columns about story", thumb: "split" },
  { id: "layout:cards", label: "Feature cards", description: "Three short points side by side", category: "Sections", keywords: "services benefits grid", thumb: "cards" },
  { id: "layout:list", label: "Questions and answers", description: "A heading with a list of answers", category: "Sections", keywords: "faq help", thumb: "faq" },
  { id: "section:testimonial", label: "Testimonial", description: "A client quote with their name", category: "Business", keywords: "review quote client", thumb: "quote" },
  { id: "section:cta", label: "Call to action", description: "A short pitch and one button", category: "Business", keywords: "contact book signup", thumb: "cta" },
  { id: "section:form", label: "Contact form", description: "Name, email, and message", category: "Forms", keywords: "contact enquiry", thumb: "form" },
  { id: "layout:stack", label: "Blank section", description: "An empty section to build in", category: "Layout", keywords: "empty start", thumb: "blank" },
  { id: "block:heading", label: "Heading", description: "A title for a section", category: "Text", keywords: "title h2", thumb: "heading", block: "heading" },
  { id: "block:paragraph", label: "Paragraph", description: "A few sentences", category: "Text", keywords: "body copy text", thumb: "text", block: "paragraph" },
  { id: "block:eyebrow", label: "Small heading", description: "A short label above a heading", category: "Text", keywords: "eyebrow kicker label", thumb: "heading", block: "eyebrow" },
  { id: "block:list", label: "List", description: "Bulleted or numbered points", category: "Text", keywords: "bullets points", thumb: "list", block: "list" },
  { id: "block:quote", label: "Quote", description: "A pulled-out quote", category: "Text", keywords: "blockquote", thumb: "quote", block: "quote" },
  { id: "block:button", label: "Button", description: "A link that looks like a button", category: "Buttons and links", keywords: "cta link", thumb: "button", block: "button" },
  { id: "block:link", label: "Text link", description: "An underlined link", category: "Buttons and links", keywords: "anchor", thumb: "text", block: "link" },
  { id: "block:image", label: "Image", description: "One picture", category: "Media", keywords: "photo picture", thumb: "image", block: "image" },
  { id: "section:gallery", label: "Gallery", description: "A grid of pictures", category: "Media", keywords: "photos grid", thumb: "gallery" },
  { id: "section:video", label: "Video", description: "A YouTube or Vimeo video", category: "Media", keywords: "youtube vimeo", thumb: "video" },
  { id: "section:audio", label: "Audio", description: "An audio player", category: "Media", keywords: "podcast sound", thumb: "audio" },
  { id: "section:divider", label: "Divider", description: "A thin line between sections", category: "Layout", keywords: "rule hr", thumb: "divider" },
  { id: "section:spacer", label: "Spacer", description: "Empty space", category: "Layout", keywords: "gap space", thumb: "spacer" },
  { id: "section:freeform", label: "Freeform zone", description: "Place items anywhere", category: "Layout", keywords: "canvas absolute", thumb: "zone" },
  { id: "section:card", label: "Card", description: "A boxed heading and text", category: "Layout", keywords: "box panel", thumb: "card" },
  { id: "section:features", label: "Feature list", description: "Points with short explanations", category: "Business", keywords: "services", thumb: "cards" },
  { id: "section:faq", label: "FAQ", description: "Questions people ask", category: "Business", keywords: "questions", thumb: "faq" },
  { id: "section:map", label: "Map", description: "Your address on a map", category: "Business", keywords: "location address", thumb: "map" },
  { id: "section:newsletter", label: "Newsletter signup", description: "Collect email addresses", category: "Forms", keywords: "email subscribe", thumb: "newsletter" },
  { id: "section:search", label: "Search box", description: "Search pages and Insights", category: "Forms", keywords: "find", thumb: "search" },
  { id: "section:social", label: "Social links", description: "Links to your profiles", category: "Social", keywords: "linkedin twitter instagram", thumb: "social" },
  { id: "section:insights-summary", label: "Insights summary", description: "A heading for recent writing", category: "Blog", keywords: "posts articles", thumb: "summary" },
  { id: "section:embed", label: "Embed", description: "Another site's widget (https only)", category: "Layout", keywords: "iframe widget", thumb: "embed", embed: true },
];

export const CATEGORIES: LibraryCategory[] = ["Sections", "Text", "Media", "Buttons and links", "Layout", "Forms", "Business", "Social", "Blog"];

export function searchLibrary(query: string, category: LibraryCategory | "All", canEmbed: boolean): LibraryEntry[] {
  const needle = query.trim().toLowerCase();
  return LIBRARY.filter((entry) => {
    if (entry.embed && !canEmbed) return false;
    if (category !== "All" && entry.category !== category) return false;
    if (!needle) return true;
    return `${entry.label} ${entry.description} ${entry.keywords} ${entry.category}`.toLowerCase().includes(needle);
  });
}

export function recommendedFor(sections: Section[]): string[] {
  const hasHero = sections.some((section) => section.type === "flow" && section.layout === "hero");
  const hasCta = sections.some((section) => section.type === "cta" || (section.type === "flow" && section.layout === "cta"));
  const picks = [hasHero ? "layout:split" : "layout:hero", "layout:cards", hasCta ? "section:testimonial" : "section:cta", "section:form"];
  return picks;
}

/** A new section for a library entry. Text-level entries become a small flow section holding that block. */
export function sectionForEntry(entry: LibraryEntry, canEmbed: boolean): Section | null {
  const [kind, type] = entry.id.split(":");
  if (kind === "layout") return catalogSection(type as Parameters<typeof catalogSection>[0]);
  if (kind === "section") {
    if (type === "embed" && !canEmbed) return null;
    return createSection(type as LibraryBlock);
  }
  if (kind === "block" && entry.block) {
    const block = blockForKind(entry.block);
    return { id: createId("sec"), type: "flow", hidden: false, editorName: entry.label, layout: "stack", blocks: [block] };
  }
  return null;
}

export function blockForKind(kind: FlowBlock["kind"]): FlowBlock {
  const block: FlowBlock = { id: createId("blk"), kind, hidden: false };
  if (kind === "heading") block.text = { text: "New heading", marks: [] };
  if (kind === "paragraph") block.text = { text: "Write a sentence or two here.", marks: [] };
  if (kind === "eyebrow") block.text = { text: "Small heading", marks: [] };
  if (kind === "list") block.text = { text: "First point\nSecond point\nThird point", marks: [] };
  if (kind === "quote") block.text = { text: "A short quote from a client.", marks: [] };
  if (kind === "button") {
    block.text = { text: "Get in touch", marks: [] };
    block.href = "/contact";
  }
  if (kind === "link") {
    block.text = { text: "Read more", marks: [] };
    block.href = "/";
  }
  return block;
}

export function entryById(id: string) {
  return LIBRARY.find((entry) => entry.id === id);
}
