"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { PROVIDER_LOCK_MESSAGE, type BlogDraft, type FreeformItem } from "@/lib/content-schema";
import type { EditorApi } from "@/components/editor/types";
import { Empty } from "@/components/editor/ui";
import { BlockVisibility, ButtonContent, ButtonStyle, ImageContent, ImageStyle, TEXT_KINDS, TextContent, TextStyleTab } from "@/components/editor/inspector/blocks";
import { SectionAdvanced, SectionContent, SectionLayoutTab, SectionStyleTab, sectionHasContent, sectionName } from "@/components/editor/inspector/section";
import { PageTab, PostTab, SeoTab } from "@/components/editor/inspector/page";
import { FooterInspector, FreeformInspector, HeaderInspector, NavInspector } from "@/components/editor/inspector/chrome";

const BLOCK_LABELS: Record<string, string> = {
  eyebrow: "Small heading",
  heading: "Heading",
  paragraph: "Paragraph",
  button: "Button",
  image: "Image",
  link: "Text link",
  list: "List",
  quote: "Quote",
  person: "Person",
  card: "Card",
  "brand-mark": "Logo mark",
  insights: "Insights list",
};

type Mode =
  | { kind: "none" }
  | { kind: "locked"; label: string }
  | { kind: "header" | "footer" }
  | { kind: "nav"; route: string }
  | { kind: "text" | "button" | "image" | "block-other" }
  | { kind: "section" }
  | { kind: "freeform"; item?: FreeformItem }
  | { kind: "page" }
  | { kind: "post" };

const TABS: Record<string, { id: string; label: string }[]> = {
  text: [{ id: "content", label: "Content" }, { id: "design", label: "Design" }, { id: "layout", label: "Layout" }],
  button: [{ id: "content", label: "Content" }, { id: "design", label: "Design" }, { id: "layout", label: "Layout" }],
  image: [{ id: "content", label: "Content" }, { id: "layout", label: "Layout" }],
  "block-other": [{ id: "layout", label: "Layout" }],
  section: [{ id: "content", label: "Content" }, { id: "layout", label: "Layout" }, { id: "design", label: "Design" }, { id: "advanced", label: "Advanced" }],
  freeform: [{ id: "content", label: "Content" }, { id: "arrange", label: "Arrange" }],
  page: [{ id: "page", label: "Page" }, { id: "seo", label: "Search" }],
  post: [{ id: "post", label: "Post" }],
};

export function Inspector(props: {
  api: EditorApi;
  post?: BlogDraft;
  onPost: (post: BlogDraft) => void;
  onPostBlock: (block: BlogDraft["blocks"][number]) => void;
  onDuplicatePage: () => void;
  onOpenPage: (route: string) => void;
  onClear: () => void;
  managedRoute: boolean;
}) {
  const { api } = props;
  const selection = api.selection;
  const page = api.page;
  const section = page?.sections.find((item) => item.id === selection.sectionId);
  const block = section?.type === "flow" ? section.blocks.find((item) => item.id === selection.itemId) : undefined;
  const zoneItems = section?.type === "freeform" ? section.items : section?.type === "preset" && selection.overlay ? section.overlay ?? [] : [];
  const zoneItem = zoneItems.find((item) => item.id === selection.itemId);

  let mode: Mode = { kind: "none" };
  if (selection.locked) mode = { kind: "locked", label: section ? sectionName(section) : "This part" };
  else if (selection.navRoute) mode = { kind: "nav", route: selection.navRoute };
  else if (selection.chrome === "header" || selection.chrome === "footer") mode = { kind: selection.chrome };
  else if (block?.locked) mode = { kind: "locked", label: BLOCK_LABELS[block.kind] ?? "Item" };
  else if (block) mode = { kind: block.kind === "button" ? "button" : block.kind === "image" ? "image" : (TEXT_KINDS as readonly string[]).includes(block.kind) ? "text" : "block-other" };
  else if (section && (section.type === "freeform" || selection.overlay)) mode = { kind: "freeform", item: zoneItem };
  else if (section) mode = { kind: "section" };
  else if (props.post) mode = { kind: "post" };
  else if (page) mode = { kind: "page" };

  const tabs = (TABS[mode.kind] ?? []).filter((item) => {
    if (mode.kind !== "section" || !section) return true;
    if (item.id === "design") return section.type !== "preset" && section.type !== "designed";
    if (item.id === "content") return sectionHasContent(section);
    return true;
  });
  const [tab, setTab] = useState(tabs[0]?.id ?? "");
  const tabKey = `${mode.kind}:${selection.sectionId}:${selection.itemId}`;
  const [lastKey, setLastKey] = useState(tabKey);
  if (lastKey !== tabKey) {
    setLastKey(tabKey);
    if (!tabs.some((item) => item.id === tab)) setTab(tabs[0]?.id ?? "");
  }
  const active = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id ?? "";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || !(event.target instanceof HTMLElement) || !event.target.closest(".ed-inspector")) return;
      if (event.target.closest("input, textarea, select")) (event.target as HTMLElement).blur();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const title =
    mode.kind === "page" ? page?.title ?? "Page"
    : mode.kind === "post" ? props.post?.title ?? "Insights post"
    : mode.kind === "header" ? "Header"
    : mode.kind === "footer" ? "Footer"
    : mode.kind === "nav" ? "Menu link"
    : mode.kind === "locked" ? mode.label
    : block ? block.editorName || BLOCK_LABELS[block.kind] || "Item"
    : zoneItem ? zoneItem.kind.charAt(0).toUpperCase() + zoneItem.kind.slice(1)
    : section ? sectionName(section)
    : "Nothing selected";

  return (
    <aside className="ed-inspector" aria-label="Properties">
      <div className="ed-inspector-head">
        <nav className="ed-crumbs" aria-label="Selection path">
          {page ? (
            <button type="button" onClick={props.onClear}>{page.title}</button>
          ) : (
            <span>{props.post ? "Insights" : "Page"}</span>
          )}
          {section && (block || zoneItem) ? (
            <>
              <ChevronRight size={12} aria-hidden="true" />
              <button type="button" onClick={() => api.selectNode(section.id)}>{sectionName(section)}</button>
            </>
          ) : null}
        </nav>
        <h2 className="ed-inspector-title">{title}</h2>
      </div>
      {tabs.length > 1 ? (
        <div className="ed-tabs" role="tablist" aria-label="Property groups">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-selected={active === item.id} aria-controls="inspector-panel" onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="ed-inspector-body" id="inspector-panel" role={tabs.length > 1 ? "tabpanel" : undefined} aria-labelledby={tabs.length > 1 ? `tab-${active}` : undefined}>
        {mode.kind === "none" ? (
          props.managedRoute ? (
            <Empty title="This page is managed for you">Articles, search results, and system pages come from your website provider. Choose a page on the left to edit it.</Empty>
          ) : (
            <Empty title="Select something to edit">Click any text, image, or section on the page. Double-click text to type.</Empty>
          )
        ) : null}
        {mode.kind === "locked" ? (
          <div className="ed-locked">
            <Lock size={16} aria-hidden="true" />
            <p>{PROVIDER_LOCK_MESSAGE}</p>
          </div>
        ) : null}
        {mode.kind === "header" ? <HeaderInspector api={api} /> : null}
        {mode.kind === "footer" ? <FooterInspector api={api} /> : null}
        {mode.kind === "nav" ? <NavInspector api={api} route={mode.route} onOpen={props.onOpenPage} /> : null}
        {block && section?.type === "flow" ? (
          <>
            {mode.kind === "text" && active === "content" ? <TextContent api={api} section={section} block={block} /> : null}
            {mode.kind === "text" && active === "design" ? <TextStyleTab api={api} section={section} block={block} /> : null}
            {mode.kind === "button" && active === "content" ? <ButtonContent api={api} section={section} block={block} /> : null}
            {mode.kind === "button" && active === "design" ? <ButtonStyle api={api} section={section} block={block} /> : null}
            {mode.kind === "image" && active === "content" ? <ImageContent api={api} section={section} block={block} /> : null}
            {mode.kind === "image" && active === "layout" ? <ImageStyle api={api} section={section} block={block} /> : null}
            {active === "layout" && mode.kind !== "locked" ? <BlockVisibility api={api} section={section} block={block} /> : null}
          </>
        ) : null}
        {mode.kind === "section" && section ? (
          <>
            {active === "content" ? <SectionContent api={api} section={section} /> : null}
            {active === "layout" ? <SectionLayoutTab api={api} section={section} /> : null}
            {active === "design" ? <SectionStyleTab api={api} section={section} /> : null}
            {active === "advanced" ? <SectionAdvanced api={api} section={section} /> : null}
          </>
        ) : null}
        {mode.kind === "freeform" && section ? <FreeformInspector api={api} section={section} item={mode.item} tab={active} /> : null}
        {mode.kind === "page" && page ? (
          <>
            {active === "page" ? <PageTab api={api} page={page} onDuplicate={props.onDuplicatePage} /> : null}
            {active === "seo" ? <SeoTab api={api} page={page} /> : null}
          </>
        ) : null}
        {mode.kind === "post" && props.post ? <PostTab api={api} post={props.post} onPost={props.onPost} onBlock={props.onPostBlock} /> : null}
      </div>
    </aside>
  );
}
