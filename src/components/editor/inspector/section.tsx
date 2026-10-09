"use client";

import { useState } from "react";
import { BookmarkPlus, Clipboard, CopyPlus, Heading, ImageIcon, List, MousePointerClick, Pilcrow, Trash2 } from "lucide-react";
import type { FlowBlock, Section } from "@/lib/content-schema";
import { addFlowBlock, anchorFrom, applyText, setEditorName, setSectionAnchor, setHideOn, setSectionHidden, setSectionLayout, setSectionStyle } from "@/lib/editor-ops";
import type { EditorApi } from "@/components/editor/types";
import { Field, Group, Segmented, Select, TextInput, Toggle } from "@/components/editor/ui";
import { DeviceVisibility, LinkPicker } from "@/components/editor/inspector/shared";

const LAYOUTS = [
  { value: "stack", label: "Stacked" },
  { value: "split", label: "Two columns" },
  { value: "cards", label: "Cards in a row" },
  { value: "list", label: "List" },
  { value: "hero", label: "Hero" },
  { value: "band", label: "Slim band" },
  { value: "cta", label: "Dark call to action" },
  { value: "fluid", label: "Free placement" },
] as const;

const ADDABLE: { kind: FlowBlock["kind"]; label: string; icon: React.ReactNode }[] = [
  { kind: "heading", label: "Heading", icon: <Heading size={14} aria-hidden="true" /> },
  { kind: "paragraph", label: "Paragraph", icon: <Pilcrow size={14} aria-hidden="true" /> },
  { kind: "button", label: "Button", icon: <MousePointerClick size={14} aria-hidden="true" /> },
  { kind: "image", label: "Image", icon: <ImageIcon size={14} aria-hidden="true" /> },
  { kind: "list", label: "List", icon: <List size={14} aria-hidden="true" /> },
];

export function sectionName(section: Section) {
  if (section.editorName) return section.editorName;
  if (section.type === "flow") return LAYOUTS.find((item) => item.value === section.layout)?.label ?? "Section";
  if (section.type === "preset") return section.preset.charAt(0).toUpperCase() + section.preset.slice(1);
  return section.type.charAt(0).toUpperCase() + section.type.slice(1).replace(/-/g, " ");
}

function hrefFieldOf(section: Section) {
  return section.type === "button" || section.type === "cta" ? "href" : section.type === "preset" && section.buttonHref !== undefined ? "buttonHref" : "";
}

export function sectionHasContent(section: Section) {
  return Boolean(hrefFieldOf(section)) || section.type === "video" || section.type === "image" || section.type === "map";
}

export function SectionContent({ api, section }: { api: EditorApi; section: Section }) {
  const disabled = !api.canEdit;
  const hrefField = hrefFieldOf(section);
  const href = section.type === "button" || section.type === "cta" ? section.href : section.type === "preset" ? section.buttonHref ?? "" : "";
  return (
    <>
      {hrefField ? (
        <Group title="Button link">
          <LinkPicker key={section.id} site={api.site} value={href} disabled={disabled} onChange={(value) => api.commit(applyText(api.site, api.path, section.id, hrefField, value), true)} />
        </Group>
      ) : null}
      {section.type === "video" ? (
        <Group title="Video">
          <Field label="YouTube or Vimeo link">
            <TextInput value={section.url} placeholder="https://www.youtube.com/watch?v=" disabled={disabled} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "url", value), `${section.id}:url`, true)} />
          </Field>
        </Group>
      ) : null}
      {section.type === "image" ? (
        <Group title="Image">
          <button type="button" className="ed-button" disabled={disabled} onClick={api.openPicker}><ImageIcon size={14} aria-hidden="true" /> {section.src ? "Replace image" : "Choose image"}</button>
          <Field label="Describe the picture" hint="Say what the picture shows for people who use screen readers.">
            <TextInput value={section.alt} disabled={disabled} maxLength={200} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "alt", value), `${section.id}:alt`, true)} />
          </Field>
        </Group>
      ) : null}
      {section.type === "map" ? (
        <Group title="Address">
          <TextInput value={section.address} disabled={disabled} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "address", value), `${section.id}:address`, true)} />
        </Group>
      ) : null}
      <p className="ed-hint ed-pad">Double-click any text in this section on the page to change it.</p>
    </>
  );
}

export function SectionAdvanced({ api, section }: { api: EditorApi; section: Section }) {
  const disabled = !api.canEdit;
  const reusable = section.type !== "designed" && section.type !== "embed" && !(section.type === "preset" && section.providerLocked);
  return (
    <>
      <Group title="Name">
        <Field label="Name in the layers list" hint="Only you see this name.">
          <TextInput value={section.editorName ?? ""} placeholder={sectionName(section)} disabled={disabled} maxLength={80} onChange={(value) => api.commitText(setEditorName(api.site, api.path, section.id, value), `${section.id}:name`)} />
        </Field>
        <AnchorField key={section.id} api={api} section={section} />
      </Group>
      <Group title="Reuse">
        <div className="ed-row">
          <button type="button" className="ed-button" disabled={disabled} onClick={() => api.run("duplicate")}>
            <CopyPlus size={14} aria-hidden="true" /> Duplicate
          </button>
          {reusable ? (
            <>
              <button type="button" className="ed-button" disabled={disabled} onClick={() => api.run("copy")}>
                <Clipboard size={14} aria-hidden="true" /> Copy
              </button>
              <button type="button" className="ed-button" disabled={disabled} onClick={() => api.run("template")}>
                <BookmarkPlus size={14} aria-hidden="true" /> Save as template
              </button>
            </>
          ) : null}
        </div>
      </Group>
      <Group title="Remove">
        <button type="button" className="ed-button is-danger-outline" disabled={disabled} onClick={() => api.run("delete")}>
          <Trash2 size={14} aria-hidden="true" /> Delete section
        </button>
        <p className="ed-hint">You can undo this.</p>
      </Group>
    </>
  );
}

export function SectionStyleTab({ api, section }: { api: EditorApi; section: Section }) {
  const disabled = !api.canEdit;
  const current = section.style ?? {};
  const set = (style: NonNullable<Section["style"]>) => api.commit(setSectionStyle(api.site, api.path, section.id, style), true);
  return (
    <>
      <Group title="Background">
        <Segmented
          label="Background"
          value={current.background === "band" || current.background === "ink" ? current.background : current.color ? "custom" : "paper"}
          disabled={disabled}
          options={[{ value: "paper", label: "Page" }, { value: "band", label: "Soft" }, { value: "ink", label: "Dark" }, { value: "custom", label: "Color" }]}
          onChange={(value) => (value === "custom" ? set({ background: "paper", color: current.color ?? "#efebe4" }) : set({ background: value, color: undefined }))}
        />
        {current.color && current.background !== "band" && current.background !== "ink" ? (
          <Field label="Background color">
            <input className="ed-color" type="color" value={current.color} disabled={disabled} onChange={(event) => set({ color: event.target.value })} />
          </Field>
        ) : null}
      </Group>
      <Group title="Spacing">
        <Field label="Space above and below">
          <Segmented label="Padding" value={current.padding ?? "m"} disabled={disabled} options={[{ value: "s", label: "Tight" }, { value: "m", label: "Normal" }, { value: "l", label: "Roomy" }]} onChange={(value) => set({ padding: value })} />
        </Field>
        <Field label="Minimum height">
          <Select label="Minimum height" value={current.minHeight ?? "auto"} disabled={disabled} options={[{ value: "auto", label: "Fit the content" }, { value: "quarter", label: "A quarter of the screen" }, { value: "half", label: "Half the screen" }, { value: "full", label: "The full screen" }]} onChange={(value) => set({ minHeight: value })} />
        </Field>
      </Group>
      {section.type === "flow" ? (
        <Group title="Width and alignment">
          <Segmented label="Content width" value={current.width ?? "content"} disabled={disabled} options={[{ value: "content", label: "Centered column" }, { value: "full", label: "Full width" }]} onChange={(value) => set({ width: value })} />
          <Segmented label="Content alignment" value={current.align ?? "start"} disabled={disabled} options={[{ value: "start", label: "Left" }, { value: "center", label: "Center" }]} onChange={(value) => set({ align: value })} />
        </Group>
      ) : null}
    </>
  );
}

export function SectionLayoutTab({ api, section }: { api: EditorApi; section: Section }) {
  const disabled = !api.canEdit;
  return (
    <>
      {section.type === "flow" ? (
        <Group title="Arrangement">
          <Select label="Arrangement" value={section.layout ?? "stack"} disabled={disabled} options={LAYOUTS} onChange={(value) => api.commit(setSectionLayout(api.site, api.path, section.id, value), true)} />
          {section.layout === "fluid" ? <p className="ed-hint">Drag items anywhere in this section. They snap to edges and to each other.</p> : null}
        </Group>
      ) : null}
      {section.type === "flow" ? (
        <Group title="Add to this section">
          <div className="ed-tiles">
            {ADDABLE.map((item) => (
              <button key={item.kind} type="button" className="ed-tile" disabled={disabled} onClick={() => api.commit(addFlowBlock(api.site, api.path, section.id, item.kind, api.selection.itemId || undefined), true)}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </Group>
      ) : null}
      <Group title="Visibility">
        <Toggle label="Show on the website" checked={!section.hidden} disabled={disabled || (section.type === "preset" && section.providerLocked)} onChange={(visible) => api.commit(setSectionHidden(api.site, api.path, section.id, !visible), true)} />
        <DeviceVisibility hideOn={section.hideOn} disabled={disabled} onChange={(device, hidden) => api.commit(setHideOn(api.site, api.path, section.id, device, hidden), true)} />
      </Group>
    </>
  );
}

function AnchorField({ api, section }: { api: EditorApi; section: Section }) {
  const [draft, setDraft] = useState(section.anchor ?? "");
  const [error, setError] = useState("");
  const commit = () => {
    const anchor = anchorFrom(draft);
    const page = api.site.pages.find((item) => item.route === api.path);
    if (anchor && page?.sections.some((item) => item.id !== section.id && item.anchor === anchor)) {
      setError(`Another section on this page already uses #${anchor}.`);
      return;
    }
    setError("");
    setDraft(anchor ?? "");
    if (anchor !== section.anchor) api.commit(setSectionAnchor(api.site, api.path, section.id, draft), true);
  };
  return (
    <Field label="Anchor" hint={error || (section.anchor ? `Link to this section with ${api.path === "/" ? "" : api.path}#${section.anchor}` : "Lets a link jump straight to this section.")}>
      <input
        className={error ? "ed-input is-invalid" : "ed-input"}
        value={draft}
        placeholder="our-services"
        maxLength={40}
        disabled={!api.canEdit}
        aria-invalid={error ? true : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
        }}
      />
    </Field>
  );
}
