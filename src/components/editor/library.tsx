"use client";

import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, LIBRARY, searchLibrary, type LibraryCategory, type LibraryEntry } from "@/lib/library";
import { Empty } from "@/components/editor/ui";
import type { NodeDocument } from "@/platform/document/node";
import { createButton } from "@/platform/elements/button";
import { createIconButton } from "@/platform/elements/icon-button";
import { createContainer } from "@/platform/elements/container";
import { createInput } from "@/platform/elements/input";
import { createTextarea } from "@/platform/elements/textarea";
import { createSelect } from "@/platform/elements/select";
import { createCheckbox } from "@/platform/elements/checkbox";
import { createForm } from "@/platform/elements/form";
import { canvasControlsVisible, formControlsVisible, libraryEntryVisible } from "@/components/editor/inspector/capability-gate";
import { createFaq } from "@/platform/elements/faq";
import { createTestimonial } from "@/platform/elements/testimonial";
import { createCta } from "@/platform/elements/cta";
import { createCard } from "@/platform/elements/card";
import { createGroup } from "@/platform/elements/group";
import { createCanvas } from "@/platform/elements/canvas";
import { createGrid } from "@/platform/elements/grid";
import { createStack } from "@/platform/elements/stack";
import { createDivider } from "@/platform/elements/divider";
import { createIcon } from "@/platform/elements/icon";
import { createSpacer } from "@/platform/elements/spacer";
import { createImage } from "@/platform/elements/image";
import { createGallery } from "@/platform/elements/gallery";
import { createVideo } from "@/platform/elements/video";
import { createHeading } from "@/platform/elements/heading";
import { createLink } from "@/platform/elements/link";
import { createParagraph } from "@/platform/elements/paragraph";
import { createRichText } from "@/platform/elements/richtext";
import { customCatalog, type CustomDefinition } from "@/platform/elements/custom";

export const GENERIC_ENTRIES: LibraryEntry[] = [
  { id: "element:heading", label: "Heading", description: "A heading", category: "Text", keywords: "title heading", thumb: "heading" },
  { id: "element:paragraph", label: "Paragraph", description: "A paragraph", category: "Text", keywords: "body paragraph", thumb: "text" },
  { id: "element:richtext", label: "Rich text", description: "Text you can bold", category: "Text", keywords: "bold italic marks", thumb: "text" },
  { id: "element:link", label: "Link", description: "A text link", category: "Text", keywords: "anchor href", thumb: "text" },
  { id: "element:button", label: "Button", description: "A button", category: "Calls to action", keywords: "button cta", thumb: "button" },
  { id: "element:icon-button", label: "Icon button", description: "A button that is an icon", category: "Calls to action", keywords: "icon aria", thumb: "button" },
  { id: "element:image", label: "Image", description: "A picture", category: "Media", keywords: "photo picture", thumb: "image" },
  { id: "element:gallery", label: "Gallery", description: "An empty picture grid", category: "Media", keywords: "photos grid", thumb: "gallery" },
  { id: "element:video", label: "Video", description: "A video", category: "Media", keywords: "youtube vimeo", thumb: "video" },
  { id: "element:icon", label: "Icon", description: "An icon", category: "Media", keywords: "icon arrow", thumb: "social" },
  { id: "element:divider", label: "Divider", description: "A horizontal line", category: "Sections", keywords: "rule hr", thumb: "divider" },
  { id: "element:spacer", label: "Spacer", description: "Empty space", category: "Sections", keywords: "gap space", thumb: "spacer" },
  { id: "element:container", label: "Container", description: "A box for other elements", category: "Sections", keywords: "box wrap", thumb: "blank" },
  { id: "element:stack", label: "Stack", description: "A vertical or horizontal stack", category: "Sections", keywords: "column row", thumb: "blank" },
  { id: "element:grid", label: "Grid", description: "A two-column grid", category: "Sections", keywords: "columns", thumb: "cards" },
  { id: "element:canvas", label: "Canvas", description: "A free canvas", category: "Freeform zone", keywords: "canvas", thumb: "zone" },
  { id: "element:group", label: "Group", description: "An empty group", category: "Sections", keywords: "group", thumb: "blank" },
  { id: "element:card", label: "Card", description: "A heading and some text", category: "Sections", keywords: "card", thumb: "card" },
  { id: "element:cta", label: "Call to action", description: "A heading, text, and a button", category: "Calls to action", keywords: "cta button", thumb: "cta" },
  { id: "element:testimonial", label: "Testimonial", description: "A quote, a name, and a role", category: "Testimonials", keywords: "quote review", thumb: "quote" },
  { id: "element:faq", label: "FAQ", description: "A question and an answer", category: "FAQ", keywords: "question answer", thumb: "faq" },
  { id: "element:form", label: "Form", description: "Name, email, and a message", category: "Forms", keywords: "contact", thumb: "form" },
  { id: "element:input", label: "Input", description: "A single field", category: "Forms", keywords: "field text", thumb: "form" },
  { id: "element:textarea", label: "Text area", description: "A multi-line field", category: "Forms", keywords: "textarea message", thumb: "form" },
  { id: "element:select", label: "Select", description: "A choice of two", category: "Forms", keywords: "dropdown options", thumb: "form" },
  { id: "element:checkbox", label: "Checkbox", description: "A yes or no field", category: "Forms", keywords: "check option", thumb: "form" },
];

function entryVisible(entry: LibraryEntry, query: string, category: LibraryCategory | "All" | "Saved") {
  if (category === "Saved") return false;
  if (category !== "All" && entry.category !== category) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${entry.label} ${entry.description} ${entry.keywords} ${entry.category}`.toLowerCase().includes(needle);
}

export function Thumb({ kind }: { kind: LibraryEntry["thumb"] }) {
  const line = (width: string, strong = false) => <span className={strong ? "t-line is-strong" : "t-line"} style={{ width }} />;
  const box = (className = "") => <span className={`t-box ${className}`} />;
  return (
    <span className={`ed-thumb t-${kind}`} aria-hidden="true">
      {kind === "hero" ? (<>{line("40%")}{line("80%", true)}{line("60%", true)}<span className="t-pill" /></>) : null}
      {kind === "split" ? (<span className="t-row"><span className="t-col">{line("90%", true)}{line("80%")}{line("70%")}</span>{box("t-grow")}</span>) : null}
      {kind === "cards" ? (<span className="t-row">{box()}{box()}{box()}</span>) : null}
      {kind === "faq" ? (<>{line("60%", true)}{line("90%")}{line("90%")}{line("90%")}</>) : null}
      {kind === "quote" ? (<><span className="t-quote">“</span>{line("85%", true)}{line("40%")}</>) : null}
      {kind === "cta" ? (<span className="t-dark">{line("60%", true)}<span className="t-pill is-light" /></span>) : null}
      {kind === "form" ? (<>{box("t-input")}{box("t-input")}{box("t-input t-tall")}<span className="t-pill" /></>) : null}
      {kind === "newsletter" ? (<>{line("60%", true)}<span className="t-row">{box("t-input t-grow")}<span className="t-pill" /></span></>) : null}
      {kind === "search" ? box("t-input") : null}
      {kind === "blank" ? <span className="t-dashed" /> : null}
      {kind === "heading" ? (<>{line("75%", true)}{line("50%", true)}</>) : null}
      {kind === "text" ? (<>{line("95%")}{line("90%")}{line("70%")}</>) : null}
      {kind === "list" ? (<>{line("80%")}{line("70%")}{line("75%")}</>) : null}
      {kind === "button" ? <span className="t-pill is-wide" /> : null}
      {kind === "image" ? box("t-image") : null}
      {kind === "gallery" ? (<span className="t-row">{box("t-image")}{box("t-image")}{box("t-image")}</span>) : null}
      {kind === "video" ? <span className="t-box t-image t-play" /> : null}
      {kind === "audio" ? <span className="t-wave" /> : null}
      {kind === "divider" ? <span className="t-rule" /> : null}
      {kind === "spacer" ? <span className="t-dashed is-thin" /> : null}
      {kind === "map" ? box("t-map") : null}
      {kind === "social" ? (<span className="t-row"><span className="t-dot" /><span className="t-dot" /><span className="t-dot" /></span>) : null}
      {kind === "zone" ? (<span className="t-dashed">{box("t-float a")}{box("t-float b")}</span>) : null}
      {kind === "embed" ? <span className="t-box t-code">{"</>"}</span> : null}
      {kind === "summary" ? (<>{line("50%", true)}{line("90%")}{line("90%")}</>) : null}
      {kind === "card" ? <span className="t-box t-card">{line("60%", true)}{line("80%")}</span> : null}
    </span>
  );
}

export function LibraryBrowser(props: {
  canEmbed: boolean;
  recent: string[];
  recommended: string[];
  templates: { id: string; name: string }[];
  adapter?: Record<string, unknown> | null;
  onChoose: (entry: LibraryEntry) => void;
  onLibraryDrag?: (factoryId: string) => void;
  onLibraryDrop?: (drop: { factoryId: string; x: number; y: number }) => void;
  onElement?: (node: NodeDocument) => void;
  onCustom?: (definition: CustomDefinition) => void;
  onTemplate: (id: string) => void;
  autoFocus?: boolean;
  dense?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LibraryCategory | "All" | "Saved" | "Custom">("All");
  const dragged = useRef("");
  const pointer = useRef<{ id: string; x: number; y: number; active: boolean } | null>(null);
  const registered = useMemo(() => customCatalog(props.adapter), [props.adapter]);
  const customItems = useMemo(() => {
    if (category !== "All" && category !== "Custom") return [];
    const needle = query.trim().toLowerCase();
    return registered.filter((item) => !needle || `${item.name} ${item.id} ${item.category}`.toLowerCase().includes(needle));
  }, [registered, query, category]);
  const results = useMemo(() => {
    if (category === "Saved" || category === "Custom") return [];
    const generic = GENERIC_ENTRIES.filter((entry) => entryVisible(entry, query, category) && libraryEntryVisible(entry.id, props.adapter));
    const library = searchLibrary(query, category, props.canEmbed);
    return [...generic, ...library];
  }, [query, category, props.canEmbed, props.adapter]);
  const catalog = useMemo(() => [...GENERIC_ENTRIES, ...LIBRARY], []);
  const recent = props.recent.map((id) => catalog.find((entry) => entry.id === id)).filter((entry): entry is LibraryEntry => Boolean(entry)).slice(0, 4);
  const recommended = props.recommended.map((id) => LIBRARY.find((entry) => entry.id === id)).filter((entry): entry is LibraryEntry => Boolean(entry));
  const browsing = !query && category === "All";
  const templates = props.templates.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  function card(entry: LibraryEntry) {
    return (
      <li key={entry.id}>
        <button
          type="button"
          className="ed-lib-card"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            pointer.current = { id: entry.id, x: event.clientX, y: event.clientY, active: false };
          }}
          onPointerMove={(event) => {
            const state = pointer.current;
            if (!state || state.id !== entry.id) return;
            if (!state.active && Math.hypot(event.clientX - state.x, event.clientY - state.y) < 4) return;
            state.active = true;
            dragged.current = entry.id;
            props.onLibraryDrag?.(entry.id);
          }}
          onPointerUp={(event) => {
            const state = pointer.current;
            pointer.current = null;
            if (!state || state.id !== entry.id || !state.active) return;
            props.onLibraryDrop?.({ factoryId: entry.id, x: event.clientX, y: event.clientY });
          }}
          data-element={entry.id.startsWith("element:") ? entry.id.slice("element:".length) : undefined}
          onClick={() => {
            if (dragged.current === entry.id) {
              dragged.current = "";
              return;
            }
            if (entry.id === "element:heading" && props.onElement) props.onElement(createHeading());
            else if (entry.id === "element:paragraph" && props.onElement) props.onElement(createParagraph());
            else if (entry.id === "element:richtext" && props.onElement) props.onElement(createRichText());
            else if (entry.id === "element:link" && props.onElement) {
              const node = createLink();
              if (node) props.onElement(node);
            } else if (entry.id === "element:button" && props.onElement) props.onElement(createButton());
            else if (entry.id === "element:icon-button" && props.onElement) props.onElement(createIconButton());
            else if (entry.id === "element:image" && props.onElement) props.onElement(createImage());
            else if (entry.id === "element:gallery" && props.onElement) props.onElement(createGallery());
            else if (entry.id === "element:video" && props.onElement) {
              const node = createVideo();
              if (node) props.onElement(node);
            } else if (entry.id === "element:icon" && props.onElement) props.onElement(createIcon());
            else if (entry.id === "element:divider" && props.onElement) props.onElement(createDivider());
            else if (entry.id === "element:spacer" && props.onElement) props.onElement(createSpacer());
            else if (entry.id === "element:container" && props.onElement) props.onElement(createContainer());
            else if (entry.id === "element:stack" && props.onElement) props.onElement(createStack());
            else if (entry.id === "element:grid" && props.onElement) props.onElement(createGrid());
            else if (entry.id === "element:canvas" && props.onElement && canvasControlsVisible(props.adapter)) props.onElement(createCanvas());
            else if (entry.id === "element:group" && props.onElement) props.onElement(createGroup());
            else if (entry.id === "element:card" && props.onElement) props.onElement(createCard());
            else if (entry.id === "element:cta" && props.onElement) props.onElement(createCta());
            else if (entry.id === "element:testimonial" && props.onElement) props.onElement(createTestimonial());
            else if (entry.id === "element:faq" && props.onElement) props.onElement(createFaq());
            else if (entry.id === "element:form" && props.onElement && formControlsVisible(props.adapter)) props.onElement(createForm());
            else if (entry.id === "element:input" && props.onElement && formControlsVisible(props.adapter)) props.onElement(createInput());
            else if (entry.id === "element:textarea" && props.onElement && formControlsVisible(props.adapter)) props.onElement(createTextarea());
            else if (entry.id === "element:select" && props.onElement && formControlsVisible(props.adapter)) props.onElement(createSelect());
            else if (entry.id === "element:checkbox" && props.onElement && formControlsVisible(props.adapter)) props.onElement(createCheckbox());
            else props.onChoose(entry);
          }}
        >
          <Thumb kind={entry.thumb} />
          <span className="ed-lib-label">{entry.label}</span>
          {!props.dense ? <span className="ed-lib-desc">{entry.description}</span> : null}
        </button>
      </li>
    );
  }

  return (
    <div className="ed-library">
      <label className="ed-search">
        <Search size={14} aria-hidden="true" />
        <input autoFocus={props.autoFocus} placeholder="Search sections and elements" aria-label="Search sections and elements" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="ed-chips" role="tablist" aria-label="Categories">
        {(["All", ...CATEGORIES, ...(registered.length ? (["Custom"] as const) : []), ...(props.templates.length ? (["Saved"] as const) : [])] as const).map((name) => (
          <button key={name} type="button" role="tab" aria-selected={category === name} onClick={() => setCategory(name)}>
            {name}
          </button>
        ))}
      </div>
      <p className="ed-hint ed-lib-tip">Click to add below the selected section, or drag onto the page.</p>
      {browsing && recent.length > 0 ? (
        <>
          <h3 className="ed-lib-heading">Recently used</h3>
          <ul className="ed-lib-grid">{recent.map(card)}</ul>
        </>
      ) : null}
      {browsing ? (
        <>
          <h3 className="ed-lib-heading">Recommended here</h3>
          <ul className="ed-lib-grid">{recommended.map(card)}</ul>
        </>
      ) : null}
      {category === "Saved" || (query && templates.length > 0) ? (
        <>
          <h3 className="ed-lib-heading">Saved templates</h3>
          <ul className="ed-lib-grid">
            {templates.map((item) => (
              <li key={item.id}>
                <button type="button" className="ed-lib-card" onClick={() => props.onTemplate(item.id)}>
                  <Thumb kind="blank" />
                  <span className="ed-lib-label">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {customItems.length > 0 ? (
        <>
          <h3 className="ed-lib-heading">Custom</h3>
          <ul className="ed-lib-grid">
            {customItems.map((item) => (
              <li key={item.id}>
                <button type="button" className="ed-lib-card" data-element={item.id} onClick={() => props.onCustom?.(item)}>
                  <Thumb kind="summary" />
                  <span className="ed-lib-label">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {category !== "Saved" && category !== "Custom" ? (
        browsing ? (
          CATEGORIES.map((name) => {
            const entries = results.filter((entry) => entry.category === name);
            if (!entries.length) return null;
            return (
              <div key={name}>
                <h3 className="ed-lib-heading">{name}</h3>
                <ul className="ed-lib-grid">{entries.map(card)}</ul>
              </div>
            );
          })
        ) : (
          <ul className="ed-lib-grid">{results.map(card)}</ul>
        )
      ) : null}
      {category !== "Saved" && results.length === 0 && customItems.length === 0 && templates.length === 0 ? (
        <Empty title="Nothing matches that search">Try a simpler word, such as “image”, “form”, or “quote”.</Empty>
      ) : null}
    </div>
  );
}
