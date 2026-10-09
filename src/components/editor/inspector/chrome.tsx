"use client";

import { ExternalLink } from "lucide-react";
import type { FreeformItem, Section } from "@/lib/content-schema";
import { alignItems, applyText, patchChrome, patchItem, renameZone, setNavVisible, updatePageMeta } from "@/lib/editor-ops";
import type { EditorApi } from "@/components/editor/types";
import { Field, Group, TextArea, TextInput, Toggle } from "@/components/editor/ui";
import { LinkPicker } from "@/components/editor/inspector/shared";

export function HeaderInspector({ api }: { api: EditorApi }) {
  const chrome = api.site.chrome;
  const disabled = !api.canEdit;
  const header = (patch: Partial<typeof chrome.header>) => api.commit(patchChrome(api.site, { ...chrome, header: { ...chrome.header, ...patch } }), true);
  const announcement = (patch: Partial<typeof chrome.announcement>) => api.commit(patchChrome(api.site, { ...chrome, announcement: { ...chrome.announcement, ...patch } }), true);
  return (
    <>
      <Group title="Header">
        <Field label="Site name">
          <TextInput value={chrome.header.siteName} disabled={disabled} maxLength={80} onChange={(value) => header({ siteName: value })} />
        </Field>
        <Toggle label="Stay at the top while scrolling" checked={chrome.header.sticky} disabled={disabled} onChange={(value) => header({ sticky: value })} />
      </Group>
      <Group title="Header button">
        <Field label="Button text">
          <TextInput value={chrome.header.buttonLabel} disabled={disabled} maxLength={60} onChange={(value) => header({ buttonLabel: value })} />
        </Field>
        <LinkPicker key="header-button" site={api.site} value={chrome.header.buttonHref} disabled={disabled} onChange={(href) => header({ buttonHref: href })} />
      </Group>
      <Group title="Announcement bar">
        <Toggle label="Show an announcement above the header" checked={chrome.announcement.enabled} disabled={disabled} onChange={(value) => announcement({ enabled: value, text: chrome.announcement.text || "Something new is coming" })} />
        {chrome.announcement.enabled ? (
          <Field label="Announcement text" count={{ value: chrome.announcement.text.length, max: 200 }}>
            <TextInput value={chrome.announcement.text} disabled={disabled} maxLength={200} onChange={(value) => announcement({ text: value })} />
          </Field>
        ) : null}
      </Group>
      <p className="ed-hint ed-pad">Menu links come from your pages. Use Pages on the left to add, hide, or reorder them.</p>
    </>
  );
}

export function FooterInspector({ api }: { api: EditorApi }) {
  const chrome = api.site.chrome;
  const disabled = !api.canEdit;
  const footer = (patch: Partial<typeof chrome.footer>) => api.commit(patchChrome(api.site, { ...chrome, footer: { ...chrome.footer, ...patch } }), true);
  return (
    <Group title="Footer">
      <Field label="Short note">
        <TextArea value={chrome.footer.note} disabled={disabled} maxLength={400} onChange={(value) => footer({ note: value })} />
      </Field>
      <Field label="Copyright line">
        <TextInput value={chrome.footer.copyright} disabled={disabled} maxLength={200} onChange={(value) => footer({ copyright: value })} />
      </Field>
      <Field label="Cookie notice">
        <TextArea value={chrome.cookieText} disabled={disabled} maxLength={400} onChange={(value) => api.commit(patchChrome(api.site, { ...chrome, cookieText: value }), true)} />
      </Field>
    </Group>
  );
}

export function NavInspector({ api, route, onOpen }: { api: EditorApi; route: string; onOpen: (route: string) => void }) {
  const page = api.site.pages.find((item) => item.route === route);
  if (!page) return <p className="ed-hint ed-pad">This link points outside the pages you can edit.</p>;
  return (
    <Group title="Menu link">
      <Field label="Label">
        <TextInput value={page.navLabel ?? page.title} disabled={!api.canEdit} maxLength={80} onChange={(value) => api.commitText(updatePageMeta(api.site, route, { navLabel: value }), `${route}:nav`, true)} />
      </Field>
      <Toggle label="Show in the site menu" checked={page.navVisible} disabled={!api.canEdit || route === "/"} onChange={(value) => api.commit(setNavVisible(api.site, route, value), true)} />
      <button type="button" className="ed-button" onClick={() => onOpen(route)}><ExternalLink size={14} aria-hidden="true" /> Open {page.title}</button>
    </Group>
  );
}

export function FreeformInspector({ api, section, item, tab }: { api: EditorApi; section: Section; item?: FreeformItem; tab: string }) {
  const disabled = !api.canEdit;
  const overlay = api.selection.overlay;
  if (!item) {
    const name = section.type === "freeform" ? section.name : section.type === "preset" ? section.overlayName ?? "Hero callouts" : "";
    return (
      <Group title="Zone">
        <Field label="Zone name">
          <TextInput value={name} disabled={disabled} maxLength={80} onChange={(value) => api.commitText(renameZone(api.site, api.path, section.id, value), `${section.id}:zone`)} />
        </Field>
        <p className="ed-hint">Add items from the Add panel. Drag them anywhere in the zone; they snap to edges and to each other.</p>
      </Group>
    );
  }
  const set = (patch: Partial<FreeformItem>, reload = true) => api.commit(patchItem(api.site, api.path, section.id, item.id, patch, overlay), reload);
  if (tab === "arrange") {
    const ids = api.selection.itemIds.length ? api.selection.itemIds : [item.id];
    return (
      <>
        <Group title="Align">
          <div className="ed-row">
            {(["left", "center", "right", "top", "middle"] as const).map((mode) => (
              <button key={mode} type="button" className="ed-button" disabled={disabled} onClick={() => api.commit(alignItems(api.site, api.path, section.id, ids, api.viewport, mode, overlay), true)}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <p className="ed-hint">Aligns inside the zone on {api.viewport === "mobile" ? "phones" : api.viewport}. Use the arrow keys to nudge; hold Shift for bigger steps.</p>
        </Group>
        <Group title="Order and lock">
          <div className="ed-row">
            <button type="button" className="ed-button" disabled={disabled} onClick={() => set({ zIndex: Math.min(200, item.zIndex + 1) })}>Bring forward</button>
            <button type="button" className="ed-button" disabled={disabled} onClick={() => set({ zIndex: Math.max(0, item.zIndex - 1) })}>Send backward</button>
          </div>
          <Toggle label="Lock position" checked={item.locked} disabled={disabled} onChange={(value) => set({ locked: value })} />
          <Toggle label="Show on the website" checked={!item.hidden} disabled={disabled} onChange={(value) => set({ hidden: !value })} />
        </Group>
      </>
    );
  }
  return (
    <Group title="Content">
      {item.kind === "image" || item.kind === "graphic" ? (
        <>
          <button type="button" className="ed-button" disabled={disabled} onClick={api.openPicker}>{item.src ? "Replace image" : "Choose image"}</button>
          <Field label="Describe the picture">
            <TextInput value={item.alt ?? ""} disabled={disabled} maxLength={200} onChange={(value) => api.commitText(patchItem(api.site, api.path, section.id, item.id, { alt: value }, overlay), `${item.id}:alt`, true)} />
          </Field>
        </>
      ) : (
        <Field label="Text" hint="You can also double-click the text on the page.">
          <TextArea value={item.text ?? ""} disabled={disabled} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "text", value, item.id), `${item.id}:text`, true)} />
        </Field>
      )}
      {item.kind === "button" ? <LinkPicker key={item.id} site={api.site} value={item.href ?? ""} disabled={disabled} onChange={(href) => set({ href })} /> : null}
    </Group>
  );
}
