import fs from "node:fs";
import path from "node:path";

export type EditorSection = {
  id: string;
  type: string;
  hidden?: boolean;
  providerLocked?: boolean;
  preset?: string;
  text?: string;
  level?: 2 | 3;
  label?: string;
  href?: string;
  src?: string;
  alt?: string;
  caption?: string;
  heading?: string;
  body?: string;
  cite?: string;
  quote?: string;
  name?: string;
  role?: string;
  url?: string;
  title?: string;
  lead?: string;
  size?: string;
  tagline?: string;
  positioning?: string;
  buttonLabel?: string;
  buttonHref?: string;
  overlayName?: string;
  nameLabel?: string;
  emailLabel?: string;
  messageLabel?: string;
  images?: { src?: string; alt?: string }[];
  items?: { title?: string; body?: string; q?: string; a?: string; id?: string; kind?: string; hidden?: boolean; locked?: boolean; groupId?: string; zIndex?: number; text?: string; href?: string; src?: string; alt?: string; caption?: string; desktop?: Share; tablet?: Share; mobile?: Share }[];
  overlay?: EditorSection["items"];
  heroImage?: {
    src: string;
    alt: string;
    placement: "with-copy" | "beside-mark";
    align: "start" | "end";
    width: "narrow" | "medium" | "wide";
    aspect: "auto" | "square" | "landscape";
    focal: "center" | "top" | "bottom" | "left" | "right";
  };
};

export type Share = { x: number; y: number; w: number; h: number };

export type EditorPage = {
  id: string;
  route: string;
  title: string;
  template: string;
  navVisible?: boolean;
  archived?: boolean;
  locked?: boolean;
  seoTitle?: string;
  metaDescription?: string;
  sections: EditorSection[];
};

const BUILT_IN = new Set([
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

export function readSite(): { pages: EditorPage[] } {
  const file = path.join(process.cwd(), "src/content/editor/site.json");
  if (!fs.existsSync(file)) return { pages: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { pages?: EditorPage[] };
    return { pages: Array.isArray(parsed.pages) ? parsed.pages : [] };
  } catch {
    return { pages: [] };
  }
}

export function readEditorPage(route: string) {
  return readSite().pages.find((page) => page.route === route);
}

export function customPages() {
  return readSite().pages.filter((page) => !BUILT_IN.has(page.route) && !page.archived);
}

export const previewMode = process.env.EDITOR_PREVIEW === "1";
