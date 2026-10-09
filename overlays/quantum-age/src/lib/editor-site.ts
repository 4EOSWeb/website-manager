import fs from "node:fs";
import path from "node:path";

export type EditorSection = {
  id: string;
  type: string;
  hidden?: boolean;
  editorName?: string;
  anchor?: string;
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
  blocks?: {
    id: string;
    kind: string;
    editorName?: string;
    hidden?: boolean;
    locked?: boolean;
    pin?: boolean;
    textStyle?: TextStyle;
    variant?: "filled" | "outline" | "text";
    size?: "s" | "m" | "l";
    align?: "start" | "center" | "end";
    target?: "same" | "new";
    icon?: "arrow" | "none" | "external" | "mail" | "phone";
    width?: "s" | "m" | "l" | "full";
    listStyle?: "bullet" | "number";
    hideOn?: ("desktop" | "tablet" | "mobile")[];
    fit?: string;
    focal?: string;
    text?: { text: string; marks?: { start: number; end: number; kind: string; href?: string; color?: string }[] } | string;
    detail?: { text: string; marks?: { start: number; end: number; kind: string; href?: string; color?: string }[] } | string;
    href?: string;
    src?: string;
    alt?: string;
    zIndex?: number;
    desktop?: Share;
    tablet?: Share;
    mobile?: Share;
  }[];
  layout?: string;
  hideOn?: ("desktop" | "tablet" | "mobile")[];
  style?: { background?: string; color?: string; padding?: string; minHeight?: string; overlay?: number; width?: "content" | "full"; align?: "start" | "center" };
  fields?: { id: string; label: string; kind: string; required: boolean }[];
  thankYou?: string;
  recipient?: string;
  address?: string;
  links?: { label: string; href: string }[];
  layoutName?: string;
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

export type TextStyle = {
  preset?: "small" | "body" | "lead" | "title" | "display";
  tag?: "eyebrow" | "h1" | "h2" | "h3" | "p";
  weight?: "regular" | "medium" | "bold";
  leading?: "tight" | "normal" | "loose";
  tracking?: "tight" | "normal" | "wide";
  align?: "start" | "center" | "end";
  color?: string;
};

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
  navLabel?: string;
  parentRoute?: string;
  shareImage?: string;
  hideHeader?: boolean;
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

export type EditorChrome = {
  header: { logo: string; siteName: string; buttonLabel: string; buttonHref: string; sticky: boolean; social: { label: string; href: string }[]; hiddenOn: string[]; phoneCompact: boolean };
  footer: { copyright: string; note: string; links: { label: string; href: string }[]; contact: string[]; social: { label: string; href: string }[]; images: { src: string; alt: string }[] };
  announcement: { enabled: boolean; text: string; href: string };
  profile: { name: string; phone: string; email: string; address: string };
  theme: { ink: string; plum: string; green: string; paper: string; font: "serif" | "sans"; button: "filled" | "outline"; spacing: "compact" | "comfortable" | "roomy" };
  favicon: string;
  cookieText: string;
  analyticsId: string;
};

export function readSite(): { pages: EditorPage[]; chrome?: EditorChrome } {
  const file = path.join(process.cwd(), "src/content/editor/site.json");
  if (!fs.existsSync(file)) return { pages: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { pages?: EditorPage[]; chrome?: EditorChrome };
    return { pages: Array.isArray(parsed.pages) ? parsed.pages : [], chrome: parsed.chrome };
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
