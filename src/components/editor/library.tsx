"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, LIBRARY, searchLibrary, type LibraryCategory, type LibraryEntry } from "@/lib/library";
import { Empty } from "@/components/editor/ui";

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
  onChoose: (entry: LibraryEntry) => void;
  onTemplate: (id: string) => void;
  autoFocus?: boolean;
  dense?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LibraryCategory | "All" | "Saved">("All");
  const results = useMemo(() => (category === "Saved" ? [] : searchLibrary(query, category, props.canEmbed)), [query, category, props.canEmbed]);
  const recent = props.recent.map((id) => LIBRARY.find((entry) => entry.id === id)).filter((entry): entry is LibraryEntry => Boolean(entry)).slice(0, 4);
  const recommended = props.recommended.map((id) => LIBRARY.find((entry) => entry.id === id)).filter((entry): entry is LibraryEntry => Boolean(entry));
  const browsing = !query && category === "All";
  const templates = props.templates.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  function card(entry: LibraryEntry) {
    return (
      <li key={entry.id}>
        <button
          type="button"
          className="ed-lib-card"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("application/x-4eos-library", entry.id);
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => props.onChoose(entry)}
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
        {(["All", ...CATEGORIES, ...(props.templates.length ? (["Saved"] as const) : [])] as const).map((name) => (
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
      {category !== "Saved" ? (
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
      {category !== "Saved" && results.length === 0 && templates.length === 0 ? (
        <Empty title="Nothing matches that search">Try a simpler word, such as “image”, “form”, or “quote”.</Empty>
      ) : null}
    </div>
  );
}
