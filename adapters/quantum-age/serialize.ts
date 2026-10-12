/**
 * Maps a visual document back to the files `syncDraftToWorkspace` writes today.
 * Publish still uses that older path. This function is fixture-tested only.
 */
import type { SerializeHook, SerializedFile } from "../../src/platform/adapter/serialize.ts";
import { writtenFiles } from "../../src/platform/adapter/serialize.ts";
import { validateDocument } from "../../src/platform/document/document.ts";
import type { NodeDocument } from "../../src/platform/document/node.ts";
import { nodeTypes } from "../../src/platform/document/node-type.ts";
import { validLink } from "../../src/lib/links.ts";
import { acceptVideoUrl } from "../../src/platform/elements/video.ts";
import { sanitizeMarks, type RichMark } from "../../src/lib/rich-text.ts";
import { defaultChrome } from "./seed.ts";
import { quantumAgeHeroProps } from "./components/hero.ts";

const knownTypes = new Set<string>(nodeTypes);
const knownComponents = new Set([
  "quantum-age.header",
  "quantum-age.footer",
  "quantum-age.hero",
  "quantum-age.button",
  "quantum-age.card",
  "quantum-age.form",
  "quantum-age.insights-summary",
  "quantum-age.logo",
]);

export type UnmappedNode = {
  path: string;
  id: string;
  type: string;
  componentId?: string;
};

const emptyHome = {
  tagline: "",
  positioning: "",
  primaryButton: { label: "", href: "" },
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

function json(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function flowText(node: NodeDocument, kind: "heading" | "paragraph", marks: RichMark[] = []) {
  const text = typeof node.props.text === "string" ? node.props.text : "";
  return {
    id: node.id,
    kind,
    hidden: node.visibility.hidden === true,
    text: { text, marks: sanitizeMarks(text, marks) },
  };
}

function flowLink(node: NodeDocument) {
  const label = typeof node.props.label === "string" ? node.props.label : "";
  const href = typeof node.props.href === "string" ? node.props.href.trim() : "";
  return {
    id: node.id,
    kind: "link" as const,
    hidden: node.visibility.hidden === true,
    text: { text: label, marks: [] as RichMark[] },
    href,
  };
}

function flowButton(node: NodeDocument) {
  const label = typeof node.props.label === "string" ? node.props.label : "";
  const href = typeof node.props.href === "string" && validLink(node.props.href) ? node.props.href.trim() : "/";
  const icon = node.props.icon === "arrow" || node.props.icon === "external" || node.props.icon === "mail" || node.props.icon === "phone" ? node.props.icon : "none";
  const variant = node.props.variant === "outline" || node.props.variant === "text" || node.props.variant === "icon" ? node.props.variant : "filled";
  const size = node.props.size === "s" || node.props.size === "l" ? node.props.size : "m";
  const align = node.props.align === "center" || node.props.align === "end" ? node.props.align : "start";
  return {
    id: node.id,
    kind: "button" as const,
    hidden: node.visibility.hidden === true,
    text: { text: label, marks: [] as RichMark[] },
    href,
    icon,
    variant,
    size,
    align,
    target: node.props.target === "new" ? ("new" as const) : ("same" as const),
  };
}

function flowImage(node: NodeDocument) {
  const src = typeof node.props.src === "string" ? node.props.src : "";
  const alt = typeof node.props.alt === "string" ? node.props.alt : "";
  return {
    id: node.id,
    kind: "image" as const,
    hidden: node.visibility.hidden === true,
    ...(src ? { src } : {}),
    alt,
  };
}

function flowCard(node: NodeDocument) {
  const heading = node.children.find((child) => child.type === "heading");
  const paragraph = node.children.find((child) => child.type === "text");
  const title = heading && typeof heading.props.text === "string" ? heading.props.text : "Card title";
  const body = paragraph && typeof paragraph.props.text === "string" ? paragraph.props.text : "Card text";
  return {
    id: node.id,
    kind: "card" as const,
    hidden: node.visibility.hidden === true,
    text: { text: title, marks: [] as RichMark[] },
    detail: { text: body, marks: [] as RichMark[] },
  };
}

type FlowOut = ReturnType<typeof flowText> | ReturnType<typeof flowLink> | ReturnType<typeof flowButton> | ReturnType<typeof flowImage> | ReturnType<typeof flowCard>;

function richMarks(node: NodeDocument): RichMark[] {
  return Array.isArray(node.props.marks) ? (node.props.marks as RichMark[]) : [];
}

function videoSection(node: NodeDocument) {
  const url = typeof node.props.url === "string" ? node.props.url.trim() : "";
  return { id: node.id, type: "video" as const, hidden: node.visibility.hidden === true, url };
}

function dividerSection(node: NodeDocument) {
  return { id: node.id, type: "divider" as const, hidden: node.visibility.hidden === true };
}

function spacerSection(node: NodeDocument) {
  const size = node.props.size === "s" || node.props.size === "l" ? node.props.size : "m";
  return { id: node.id, type: "spacer" as const, hidden: node.visibility.hidden === true, size };
}

type WrappedFlow = { id: string; type: "flow"; hidden: boolean; editorName: string; layout?: "stack" | "grid"; blocks: FlowOut[] };
type CanvasOut = { id: string; type: "freeform"; hidden: boolean; name: string; items: []; metadata: { sourceNode: string } };
type CtaOut = { id: string; type: "cta"; hidden: boolean; heading: string; body: string; label: string; href: string };
type TestimonialOut = { id: string; type: "testimonial"; hidden: boolean; quote: string; name: string; role: string };
type FaqOut = { id: string; type: "faq"; hidden: boolean; heading: string; items: Array<{ q: string; a: string }> };
type ExtraSection = ReturnType<typeof dividerSection> | ReturnType<typeof spacerSection> | WrappedFlow | CanvasOut | CtaOut | TestimonialOut | FaqOut;

function walk(node: NodeDocument, path: string, unmapped: UnmappedNode[], hero: { props: unknown }, blocks: FlowOut[], videos: Array<ReturnType<typeof videoSection>>, extras: ExtraSection[]) {
  const componentId = node.componentId;
  let ownChildren = true;
  if (componentId === "quantum-age.hero") hero.props = node.props;
  else if (node.type === "heading" && componentId === "generic.heading") blocks.push(flowText(node, "heading"));
  else if (node.type === "text" && componentId === "generic.text") blocks.push(flowText(node, "paragraph"));
  else if (node.type === "richtext" && componentId === "generic.richtext") blocks.push(flowText(node, "paragraph", richMarks(node)));
  else if (node.type === "link" && componentId === "generic.link") {
    const href = typeof node.props.href === "string" ? node.props.href : "";
    if (validLink(href)) blocks.push(flowLink(node));
  } else if (node.type === "button" && (componentId === "generic.button" || componentId === "generic.icon-button")) blocks.push(flowButton(node));
  else if (node.type === "image" && componentId === "generic.image") blocks.push(flowImage(node));
  else if (node.type === "card" && componentId === "generic.card") {
    ownChildren = false;
    blocks.push(flowCard(node));
  } else if (node.type === "cta" && componentId === "generic.cta") {
    ownChildren = false;
    const heading = node.children.find((child) => child.type === "heading");
    const paragraph = node.children.find((child) => child.type === "text");
    const button = node.children.find((child) => child.type === "button");
    const href = button && typeof button.props.href === "string" && validLink(button.props.href) ? button.props.href : "/";
    extras.push({
      id: node.id,
      type: "cta",
      hidden: node.visibility.hidden === true,
      heading: heading && typeof heading.props.text === "string" ? heading.props.text : "Heading",
      body: paragraph && typeof paragraph.props.text === "string" ? paragraph.props.text : "Paragraph",
      label: button && typeof button.props.label === "string" ? button.props.label : "Continue",
      href,
    });
  } else if (node.type === "testimonial" && componentId === "generic.testimonial") {
    const quote = typeof node.props.quote === "string" ? node.props.quote : "Quote";
    const name = typeof node.props.name === "string" ? node.props.name : "Name";
    const role = typeof node.props.role === "string" ? node.props.role : "Role";
    extras.push({ id: node.id, type: "testimonial", hidden: node.visibility.hidden === true, quote, name, role });
  } else if (node.type === "faq" && componentId === "generic.faq") {
    const items = Array.isArray(node.props.items) ? node.props.items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { q?: unknown; a?: unknown };
      const q = typeof row.q === "string" ? row.q : "Question";
      const a = typeof row.a === "string" ? row.a : "Answer";
      return [{ q, a }];
    }) : [{ q: "Question", a: "Answer" }];
    extras.push({ id: node.id, type: "faq", hidden: node.visibility.hidden === true, heading: "", items });
  }
  else if (node.type === "video" && componentId === "generic.video" && acceptVideoUrl(typeof node.props.url === "string" ? node.props.url : "")) videos.push(videoSection(node));
  else if (node.type === "icon" && componentId === "generic.icon") {
    const name = typeof node.props.name === "string" && node.props.name ? node.props.name : "arrow";
    blocks.push(flowText({ ...node, props: { ...node.props, text: name } }, "paragraph"));
  } else if (node.type === "divider" && componentId === "generic.divider") extras.push(dividerSection(node));
  else if (node.type === "spacer" && componentId === "generic.spacer") extras.push(spacerSection(node));
  else if (node.type === "container" && componentId === "generic.container") {
    ownChildren = false;
    const inner: FlowOut[] = [];
    node.children.forEach((child, index) => walk(child, `${path}.children.${index}`, unmapped, hero, inner, videos, extras));
    extras.push({ id: node.id, type: "flow", hidden: node.visibility.hidden === true, editorName: "Container", blocks: inner });
  } else if (node.type === "stack" && componentId === "generic.stack") {
    ownChildren = false;
    const inner: FlowOut[] = [];
    node.children.forEach((child, index) => walk(child, `${path}.children.${index}`, unmapped, hero, inner, videos, extras));
    extras.push({ id: node.id, type: "flow", hidden: node.visibility.hidden === true, editorName: "Stack", blocks: inner });
  } else if (node.type === "grid" && componentId === "generic.grid") {
    ownChildren = false;
    const inner: FlowOut[] = [];
    node.children.forEach((child, index) => walk(child, `${path}.children.${index}`, unmapped, hero, inner, videos, extras));
    extras.push({ id: node.id, type: "flow", hidden: node.visibility.hidden === true, editorName: "Grid", layout: "grid", blocks: inner });
  } else if (node.type === "section" && componentId === "generic.canvas") {
    ownChildren = false;
    extras.push({
      id: node.id,
      type: "freeform",
      hidden: node.visibility.hidden === true,
      name: "Canvas",
      items: [],
      metadata: { sourceNode: node.id },
    });
  } else if (node.type === "group" && componentId === "generic.group") {
    ownChildren = false;
    const inner: FlowOut[] = [];
    node.children.forEach((child, index) => walk(child, `${path}.children.${index}`, unmapped, hero, inner, videos, extras));
    extras.push({ id: node.id, type: "flow", hidden: node.visibility.hidden === true, editorName: "Group", blocks: inner });
  }
  else if (!knownTypes.has(node.type) || (node.type === "custom" && !knownComponents.has(componentId))) {
    unmapped.push({ path, id: node.id, type: node.type, componentId });
  }
  if (ownChildren) node.children.forEach((child, index) => walk(child, `${path}.children.${index}`, unmapped, hero, blocks, videos, extras));
}

export const serializeQuantumAge: SerializeHook = (document) => {
  const validated = validateDocument(document);
  if (!validated.ok) return validated;
  const unmapped: UnmappedNode[] = [];
  const hero: { props: unknown } = { props: null };
  const pages = validated.value.pages.map((page) => {
    const blocks: FlowOut[] = [];
    const videos: Array<ReturnType<typeof videoSection>> = [];
    const extras: ExtraSection[] = [];
    walk(page.root, `pages.${page.route}.root`, unmapped, hero, blocks, videos, extras);
    const sections = [
      ...(blocks.length ? [{ id: `sec_${page.id.slice(5, 17)}`, type: "flow", hidden: false, blocks }] : []),
      ...videos,
      ...extras,
    ];
    return {
      id: page.id,
      route: page.route,
      title: page.title,
      template: page.route === "/" ? "home" : "marketing",
      navVisible: page.route !== "/privacy" && page.route !== "/terms" && page.route !== "/contact",
      seoTitle: page.metadata.seoTitle ?? page.title,
      metaDescription: page.metadata.metaDescription ?? "",
      archived: false,
      locked: page.route === "/privacy" || page.route === "/terms",
      sections,
    };
  });
  const parsedHero = quantumAgeHeroProps.safeParse(hero.props);
  const home = parsedHero.success ? parsedHero.data : emptyHome;
  const site = { version: 3, chrome: defaultChrome(), sectionTemplates: [], pages };
  const files: SerializedFile[] = [
    { path: "src/content/editor/site.json", contents: json(site) },
    { path: "src/content/pages/home.json", contents: json(home) },
  ];
  if (unmapped.length > 0) files.push({ path: "src/content/editor/unmapped.json", contents: json(unmapped) });
  return writtenFiles(files);
};
