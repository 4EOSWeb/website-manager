"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Copy } from "lucide-react";
import type { BlogDraft, PageDocument } from "@/lib/content-schema";
import { SITE_AUTHORS } from "@/lib/content-schema";
import { setArchived, setNavVisible, updatePageMeta } from "@/lib/editor-ops";
import type { EditorApi } from "@/components/editor/types";
import { Field, Group, Select, TextArea, TextInput, Toggle } from "@/components/editor/ui";

export function PageTab({ api, page, onDuplicate }: { api: EditorApi; page: PageDocument; onDuplicate: () => void }) {
  const disabled = !api.canEdit || page.locked;
  const parents = api.site.pages.filter((item) => item.route !== page.route && item.route !== "/" && !item.parentRoute && !item.archived);
  return (
    <>
      {page.locked ? <p className="ed-note">This page is managed for you. You can still change its menu label and search details.</p> : null}
      <Group title="Page">
        <Field label="Page name" hint="Shown in the editor and used as the menu label unless you set one below.">
          <TextInput value={page.title} disabled={disabled} maxLength={80} onChange={(value) => api.commitText(updatePageMeta(api.site, page.route, { title: value }), `${page.route}:title`, true)} />
        </Field>
        {page.template === "home" || page.template === "marketing" || page.template === "legal" ? (
          <Field label="Web address" hint="Built-in pages keep their address.">
            <TextInput value={page.route} disabled onChange={() => undefined} />
          </Field>
        ) : (
          <AddressField key={page.route} api={api} page={page} />
        )}
      </Group>
      <Group title="Menu">
        <Toggle label="Show in the site menu" checked={page.navVisible} disabled={!api.canEdit || page.route === "/" || page.archived} onChange={(value) => api.commit(setNavVisible(api.site, page.route, value), true)} />
        <Field label="Menu label">
          <TextInput value={page.navLabel ?? ""} placeholder={page.title} disabled={!api.canEdit} maxLength={80} onChange={(value) => api.commitText(updatePageMeta(api.site, page.route, { navLabel: value }), `${page.route}:nav`, true)} />
        </Field>
        {page.route !== "/" ? (
          <Field label="Show under">
            <Select label="Show under" value={page.parentRoute ?? ""} disabled={!api.canEdit} options={[{ value: "", label: "Top of the menu" }, ...parents.map((item) => ({ value: item.route, label: item.navLabel || item.title }))]} onChange={(value) => api.commit(updatePageMeta(api.site, page.route, { parentRoute: value || undefined }), true)} />
          </Field>
        ) : null}
        <Toggle label="Hide the site header on this page" checked={Boolean(page.hideHeader)} disabled={disabled} onChange={(value) => api.commit(updatePageMeta(api.site, page.route, { hideHeader: value }), true)} />
      </Group>
      {page.route !== "/" && !page.locked ? (
        <Group title="Page actions">
          <div className="ed-row">
            <button type="button" className="ed-button" disabled={!api.canEdit} onClick={onDuplicate}><Copy size={14} aria-hidden="true" /> Duplicate</button>
            <button type="button" className="ed-button" disabled={!api.canEdit} onClick={() => api.commit(setArchived(api.site, page.route, !page.archived), true)}>
              {page.archived ? <ArchiveRestore size={14} aria-hidden="true" /> : <Archive size={14} aria-hidden="true" />} {page.archived ? "Restore" : "Archive"}
            </button>
          </div>
          <p className="ed-hint">Archived pages stay in the editor and come off the public site after the next review.</p>
        </Group>
      ) : null}
    </>
  );
}

export function SeoTab({ api, page }: { api: EditorApi; page: PageDocument }) {
  const disabled = !api.canEdit;
  const title = page.seoTitle || page.title;
  return (
    <>
      <Group title="Search results">
        <Field label="Title" count={{ value: page.seoTitle.length, max: 70 }} hint="About 50 to 60 characters reads best.">
          <TextInput value={page.seoTitle} placeholder={page.title} disabled={disabled} maxLength={70} onChange={(value) => api.commitText(updatePageMeta(api.site, page.route, { seoTitle: value }), `${page.route}:seo`)} />
        </Field>
        <Field label="Description" count={{ value: page.metaDescription.length, max: 160 }} hint="One or two plain sentences about what someone finds on this page.">
          <TextArea rows={4} value={page.metaDescription} disabled={disabled} maxLength={160} onChange={(value) => api.commitText(updatePageMeta(api.site, page.route, { metaDescription: value }), `${page.route}:description`)} />
        </Field>
      </Group>
      <Group title="Preview">
        <div className="ed-serp" aria-label="How this page may look in search results">
          <span className="ed-serp-url">testsite.4eos.com{page.route === "/" ? "" : page.route}</span>
          <span className="ed-serp-title">{title}</span>
          <span className="ed-serp-desc">{page.metaDescription || "Add a description so search engines don't pick a random sentence."}</span>
        </div>
      </Group>
    </>
  );
}

export function PostTab({ api, post, onPost, onBlock }: { api: EditorApi; post: BlogDraft; onPost: (post: BlogDraft) => void; onBlock: (block: BlogDraft["blocks"][number]) => void }) {
  const disabled = !api.canEdit;
  return (
    <>
      <Group title="Insights post">
        <Field label="Author">
          <TextInput value={post.authorDisplayName} list="authors" disabled={disabled} onChange={(value) => onPost({ ...post, authorDisplayName: value })} />
          <datalist id="authors">{SITE_AUTHORS.map((name) => <option key={name} value={name} />)}</datalist>
        </Field>
        <Field label="Requested publish time" hint="Saved with the draft and shown in the review. The live site changes only after the review is merged.">
          <TextInput type="datetime-local" value={post.publishAt ?? ""} disabled={disabled} onChange={(value) => onPost({ ...post, publishAt: value })} />
        </Field>
      </Group>
      <Group title="Search results">
        <Field label="Title" count={{ value: post.seoTitle.length, max: 70 }}>
          <TextInput value={post.seoTitle} placeholder={post.title} disabled={disabled} maxLength={70} onChange={(value) => onPost({ ...post, seoTitle: value })} />
        </Field>
        <Field label="Description" count={{ value: post.metaDescription.length, max: 160 }}>
          <TextArea value={post.metaDescription} disabled={disabled} maxLength={160} onChange={(value) => onPost({ ...post, metaDescription: value })} />
        </Field>
      </Group>
      <Group title="Add to the post">
        <div className="ed-tiles">
          <button type="button" className="ed-tile" disabled={disabled} onClick={() => onBlock({ type: "paragraph", text: "" })}>Paragraph</button>
          <button type="button" className="ed-tile" disabled={disabled} onClick={() => onBlock({ type: "heading", level: 2, text: "Heading" })}>Heading</button>
          <button type="button" className="ed-tile" disabled={disabled} onClick={() => onBlock({ type: "quote", text: "" })}>Pull quote</button>
          <button type="button" className="ed-tile" disabled={disabled} onClick={() => onBlock({ type: "list", ordered: false, items: ["First point"] })}>List</button>
          <button type="button" className="ed-tile" disabled={disabled} onClick={() => onBlock({ type: "table", headers: ["Column", "Detail"], rows: [["", ""]] })}>Table</button>
          <button type="button" className="ed-tile" disabled={disabled} onClick={() => onBlock({ type: "image", src: "", alt: "" })}>Image</button>
          <button type="button" className="ed-tile" disabled={disabled} onClick={() => onBlock({ type: "link", href: "/contact", label: "Related page" })}>Link</button>
        </div>
      </Group>
    </>
  );
}

function AddressField({ api, page }: { api: EditorApi; page: PageDocument }) {
  const [draft, setDraft] = useState(page.route);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function commit() {
    if (busy || draft.trim() === page.route) return;
    setBusy(true);
    const problem = await api.changeRoute(draft);
    setBusy(false);
    setError(problem);
  }
  return (
    <Field label="Web address" hint={error || "Lowercase words joined by dashes. Links to this page on the site follow the change."}>
      <input
        className={error ? "ed-input is-invalid" : "ed-input"}
        value={draft}
        disabled={!api.canEdit || page.locked || busy}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          setDraft(event.target.value);
          setError("");
        }}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") void commit();
          if (event.key === "Escape") {
            setDraft(page.route);
            setError("");
          }
        }}
      />
    </Field>
  );
}
