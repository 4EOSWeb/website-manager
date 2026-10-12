/**
 * Maps a visual document back to the files `syncDraftToWorkspace` writes today.
 * Publish still uses that older path. This function is fixture-tested only.
 */
import type { SerializeHook, SerializedFile } from "../../src/platform/adapter/serialize.ts";
import { writtenFiles } from "../../src/platform/adapter/serialize.ts";
import { validateDocument } from "../../src/platform/document/document.ts";
import type { NodeDocument } from "../../src/platform/document/node.ts";
import { nodeTypes } from "../../src/platform/document/node-type.ts";
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

function flowHeading(node: NodeDocument) {
  const text = typeof node.props.text === "string" ? node.props.text : "";
  return {
    id: node.id,
    kind: "heading" as const,
    hidden: node.visibility.hidden === true,
    text: { text, marks: [] as string[] },
  };
}

function walk(node: NodeDocument, path: string, unmapped: UnmappedNode[], hero: { props: unknown }, headings: Array<ReturnType<typeof flowHeading>>) {
  const componentId = node.componentId;
  if (componentId === "quantum-age.hero") hero.props = node.props;
  else if (node.type === "heading" && componentId === "generic.heading") headings.push(flowHeading(node));
  else if (!knownTypes.has(node.type) || (node.type === "custom" && !knownComponents.has(componentId))) {
    unmapped.push({ path, id: node.id, type: node.type, componentId });
  }
  node.children.forEach((child, index) => walk(child, `${path}.children.${index}`, unmapped, hero, headings));
}

export const serializeQuantumAge: SerializeHook = (document) => {
  const validated = validateDocument(document);
  if (!validated.ok) return validated;
  const unmapped: UnmappedNode[] = [];
  const hero: { props: unknown } = { props: null };
  const pages = validated.value.pages.map((page) => {
    const headings: Array<ReturnType<typeof flowHeading>> = [];
    walk(page.root, `pages.${page.route}.root`, unmapped, hero, headings);
    const sections = headings.length
      ? [{ id: `sec_${page.id.slice(5, 17)}`, type: "flow", hidden: false, blocks: headings }]
      : [];
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
