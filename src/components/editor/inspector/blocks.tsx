"use client";

import { AlignCenter, AlignLeft, AlignRight, Crop, ImageIcon } from "lucide-react";
import type { FlowBlock, Section, TextStyle } from "@/lib/content-schema";
import { applyText, patchFlowBlock, pinBlock, setBlockHidden, setBlockHideOn } from "@/lib/editor-ops";
import type { EditorApi } from "@/components/editor/types";
import { Field, Group, Segmented, Select, Swatches, TextArea, TextInput, Toggle } from "@/components/editor/ui";
import { DeviceVisibility, LinkPicker, THEME_SWATCHES } from "@/components/editor/inspector/shared";

type Flow = Extract<Section, { type: "flow" }>;

const ALIGN = [
  { value: "start", label: "Align left", icon: <AlignLeft size={15} aria-hidden="true" /> },
  { value: "center", label: "Align center", icon: <AlignCenter size={15} aria-hidden="true" /> },
  { value: "end", label: "Align right", icon: <AlignRight size={15} aria-hidden="true" /> },
] as const;

export const TEXT_KINDS = ["eyebrow", "heading", "paragraph", "link", "list", "quote", "card", "person"] as const;

function words(value: FlowBlock["text"]) {
  return value && typeof value === "object" ? value.text : "";
}

function patch(api: EditorApi, section: Flow, block: FlowBlock, change: Parameters<typeof patchFlowBlock>[4]) {
  api.commit(patchFlowBlock(api.site, api.path, section.id, block.id, change), true);
}

function style(api: EditorApi, section: Flow, block: FlowBlock, change: TextStyle) {
  patch(api, section, block, { textStyle: change });
}

export function TextContent({ api, section, block }: { api: EditorApi; section: Flow; block: FlowBlock }) {
  const disabled = !api.canEdit;
  const text = words(block.text);
  const heroTitle = section.layout === "hero" && block.kind === "heading";
  const isTitle = !heroTitle && (block.kind === "eyebrow" || block.kind === "heading" || block.kind === "paragraph");
  return (
    <>
      {heroTitle ? <p className="ed-note">This is the main title of the page, so it is always an H1.</p> : null}
      {isTitle ? (
        <Group title="Text type">
          <Segmented
            label="Text type"
            value={block.kind === "heading" ? (block.textStyle?.tag === "h1" ? "h1" : block.textStyle?.tag === "h3" ? "h3" : "h2") : block.kind}
            disabled={disabled}
            options={[
              { value: "eyebrow", label: "Label" },
              { value: "h1", label: "H1" },
              { value: "h2", label: "H2" },
              { value: "h3", label: "H3" },
              { value: "paragraph", label: "Text" },
            ]}
            onChange={(value) => {
              if (value === "eyebrow" || value === "paragraph") patch(api, section, block, { kind: value, textStyle: { tag: undefined } });
              else patch(api, section, block, { kind: "heading", textStyle: { tag: value as "h1" | "h2" | "h3" } });
            }}
          />
          <p className="ed-hint">Use one H1 per page for the main title. H2 starts a section, H3 a smaller part of it.</p>
        </Group>
      ) : null}
      <Group title={block.kind === "list" ? "Items" : "Words"}>
        {block.kind === "list" ? (
          <>
            <Field label="One item per line">
              <TextArea rows={5} value={text} disabled={disabled} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "text", value, block.id, []), `${block.id}:text`, true)} />
            </Field>
            <Segmented label="List style" value={block.listStyle ?? "bullet"} disabled={disabled} options={[{ value: "bullet", label: "Bullets" }, { value: "number", label: "Numbers" }]} onChange={(value) => patch(api, section, block, { listStyle: value })} />
          </>
        ) : (
          <>
            <Field label="Text" hint="Double-click the text on the page to type there. Select words on the page to make them bold, italic, underlined, linked, or colored.">
              <TextArea rows={block.kind === "paragraph" || block.kind === "quote" ? 4 : 2} value={text} disabled={disabled} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "text", value, block.id), `${block.id}:text`, true)} />
            </Field>
            {block.kind === "card" || block.kind === "person" || block.kind === "quote" ? (
              <Field label={block.kind === "quote" ? "Who said it" : "Details"}>
                <TextArea rows={3} value={words(block.detail)} disabled={disabled} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "detail", value, block.id), `${block.id}:detail`, true)} />
              </Field>
            ) : null}
          </>
        )}
      </Group>
      {block.kind === "link" ? (
        <Group title="Link">
          <LinkPicker key={block.id} site={api.site} value={block.href ?? ""} disabled={disabled} onChange={(href) => patch(api, section, block, { href })} />
          <Toggle label="Open in a new tab" checked={block.target === "new"} disabled={disabled} onChange={(value) => patch(api, section, block, { target: value ? "new" : "same" })} />
        </Group>
      ) : null}
    </>
  );
}

export function TextStyleTab({ api, section, block }: { api: EditorApi; section: Flow; block: FlowBlock }) {
  const disabled = !api.canEdit;
  const current = block.textStyle ?? {};
  return (
    <>
      <Group title="Size">
        <Segmented
          label="Text size"
          value={current.preset}
          disabled={disabled}
          options={[
            { value: "small", label: "S" },
            { value: "body", label: "M" },
            { value: "lead", label: "L" },
            { value: "title", label: "XL" },
            { value: "display", label: "2XL" },
          ]}
          onChange={(value) => style(api, section, block, { preset: value })}
        />
      </Group>
      <Group title="Weight and spacing">
        <Field label="Weight">
          <Segmented label="Weight" value={current.weight} disabled={disabled} options={[{ value: "regular", label: "Regular" }, { value: "medium", label: "Medium" }, { value: "bold", label: "Bold" }]} onChange={(value) => style(api, section, block, { weight: value })} />
        </Field>
        <Field label="Line spacing">
          <Segmented label="Line spacing" value={current.leading} disabled={disabled} options={[{ value: "tight", label: "Tight" }, { value: "normal", label: "Normal" }, { value: "loose", label: "Loose" }]} onChange={(value) => style(api, section, block, { leading: value })} />
        </Field>
        <Field label="Letter spacing">
          <Segmented label="Letter spacing" value={current.tracking} disabled={disabled} options={[{ value: "tight", label: "Tight" }, { value: "normal", label: "Normal" }, { value: "wide", label: "Wide" }]} onChange={(value) => style(api, section, block, { tracking: value })} />
        </Field>
      </Group>
      <Group title="Alignment and color">
        <Segmented label="Alignment" value={current.align ?? "start"} disabled={disabled} options={ALIGN} onChange={(value) => style(api, section, block, { align: value })} />
        <Swatches label="Text color" value={current.color} colors={THEME_SWATCHES} allowDefault disabled={disabled} onChange={(value) => style(api, section, block, { color: value })} />
      </Group>
      <button type="button" className="ed-link" disabled={disabled || Object.keys(current).length === 0} onClick={() => style(api, section, block, { preset: undefined, weight: undefined, leading: undefined, tracking: undefined, align: undefined, color: undefined })}>
        Reset text style
      </button>
    </>
  );
}

export function ButtonContent({ api, section, block }: { api: EditorApi; section: Flow; block: FlowBlock }) {
  const disabled = !api.canEdit;
  return (
    <>
      <Group title="Label">
        <Field label="Button text" count={{ value: words(block.text).length, max: 40 }}>
          <TextInput value={words(block.text)} disabled={disabled} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "text", value.replace(/\n/g, " "), block.id), `${block.id}:text`, true)} />
        </Field>
      </Group>
      <Group title="Link">
        <LinkPicker key={block.id} site={api.site} value={block.href ?? ""} disabled={disabled} onChange={(href) => patch(api, section, block, { href })} />
        <Toggle label="Open in a new tab" checked={block.target === "new"} disabled={disabled} onChange={(value) => patch(api, section, block, { target: value ? "new" : "same" })} />
      </Group>
      <Group title="Icon">
        <Select
          label="Icon"
          value={block.icon ?? "arrow"}
          disabled={disabled}
          options={[
            { value: "arrow", label: "Arrow" },
            { value: "external", label: "Opens elsewhere" },
            { value: "mail", label: "Email" },
            { value: "phone", label: "Phone" },
            { value: "none", label: "No icon" },
          ]}
          onChange={(value) => patch(api, section, block, { icon: value })}
        />
      </Group>
    </>
  );
}

export function ButtonStyle({ api, section, block }: { api: EditorApi; section: Flow; block: FlowBlock }) {
  const disabled = !api.canEdit;
  return (
    <>
      <Group title="Look">
        <Segmented label="Button look" value={block.variant ?? "filled"} disabled={disabled} options={[{ value: "filled", label: "Filled" }, { value: "outline", label: "Outline" }, { value: "text", label: "Text" }]} onChange={(value) => patch(api, section, block, { variant: value })} />
      </Group>
      <Group title="Size">
        <Segmented label="Button size" value={block.size ?? "l"} disabled={disabled} options={[{ value: "s", label: "Small" }, { value: "m", label: "Medium" }, { value: "l", label: "Large" }]} onChange={(value) => patch(api, section, block, { size: value })} />
      </Group>
      <Group title="Alignment">
        <Segmented label="Button alignment" value={block.align ?? "start"} disabled={disabled} options={ALIGN} onChange={(value) => patch(api, section, block, { align: value })} />
      </Group>
    </>
  );
}

export function ImageContent({ api, section, block }: { api: EditorApi; section: Flow; block: FlowBlock }) {
  const disabled = !api.canEdit;
  const filename = block.src?.split("/").pop() ?? "";
  return (
    <>
      <Group title="Image">
        {block.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ed-preview-image" src={`/api/sites/${api.websiteId}/media?name=${encodeURIComponent(filename)}`} alt="" />
        ) : (
          <p className="ed-hint">No image yet. Choose one from your library or upload a new one.</p>
        )}
        <div className="ed-row">
          <button type="button" className="ed-button" disabled={disabled} onClick={api.openPicker}>
            <ImageIcon size={14} aria-hidden="true" /> {block.src ? "Replace" : "Choose image"}
          </button>
          {block.src ? (
            <button type="button" className="ed-button" disabled={disabled} onClick={api.openCrop}>
              <Crop size={14} aria-hidden="true" /> Crop
            </button>
          ) : null}
        </div>
      </Group>
      <Group title="Alt text">
        <Field label="Describe the picture" count={{ value: (block.alt ?? "").length, max: 200 }} hint="Say what the picture shows for people who use screen readers. Skip “image of”. Leave empty only if the picture is decoration.">
          <TextArea rows={3} value={block.alt ?? ""} disabled={disabled} maxLength={200} onChange={(value) => api.commitText(applyText(api.site, api.path, section.id, "alt", value, block.id), `${block.id}:alt`, true)} />
        </Field>
      </Group>
      {block.src ? <FileDetails api={api} filename={filename} /> : null}
    </>
  );
}

function FileDetails({ api, filename }: { api: EditorApi; filename: string }) {
  const item = api.media.find((entry) => entry.filename === filename);
  return (
    <Group title="File" defaultOpen={false}>
      <dl className="ed-facts">
        <dt>Name</dt>
        <dd className="truncate">{filename}</dd>
        {item?.width && item.height ? (
          <>
            <dt>Size</dt>
            <dd>
              {item.width}×{item.height}
              {item.bytes ? ` · ${Math.ceil(item.bytes / 1024)} KB` : ""}
            </dd>
          </>
        ) : null}
        <dt>Used on</dt>
        <dd>{item?.usedBy?.length ? item.usedBy.join(", ") : "This page only"}</dd>
      </dl>
    </Group>
  );
}

const FOCAL: (NonNullable<FlowBlock["focal"]> | null)[] = [null, "top", null, "left", "center", "right", null, "bottom", null];

export function ImageStyle({ api, section, block }: { api: EditorApi; section: Flow; block: FlowBlock }) {
  const disabled = !api.canEdit;
  const focal = block.focal ?? "center";
  return (
    <>
      <Group title="Fit">
        <Segmented label="Image fit" value={block.fit ?? "fit"} disabled={disabled} options={[{ value: "fit", label: "Show all" }, { value: "fill", label: "Fill the space" }]} onChange={(value) => patch(api, section, block, { fit: value })} />
        <div className="ed-field">
          <span className="ed-field-label">Keep in view when the image is cut off</span>
          <div className="ed-focal" role="radiogroup" aria-label="Part of the image to keep in view">
            {FOCAL.map((spot, index) =>
              spot ? (
                <button key={spot} type="button" role="radio" aria-checked={focal === spot} aria-label={spot.charAt(0).toUpperCase() + spot.slice(1)} data-tip={spot.charAt(0).toUpperCase() + spot.slice(1)} disabled={disabled} onClick={() => patch(api, section, block, { focal: spot })} />
              ) : (
                <span key={`gap-${index}`} aria-hidden="true" />
              ),
            )}
          </div>
          {block.fit !== "fill" ? <span className="ed-hint">Only matters when the image fills the space.</span> : null}
        </div>
      </Group>
      <Group title="Size and alignment">
        <Segmented label="Image width" value={block.width ?? "full"} disabled={disabled} options={[{ value: "s", label: "S" }, { value: "m", label: "M" }, { value: "l", label: "L" }, { value: "full", label: "Full" }]} onChange={(value) => patch(api, section, block, { width: value })} />
        <Segmented label="Image alignment" value={block.align ?? "start"} disabled={disabled} options={ALIGN} onChange={(value) => patch(api, section, block, { align: value })} />
      </Group>
    </>
  );
}

export function BlockVisibility({ api, section, block }: { api: EditorApi; section: Flow; block: FlowBlock }) {
  const disabled = !api.canEdit;
  return (
    <>
      <Group title="Visibility">
        <Toggle label="Show on the website" checked={!block.hidden} disabled={disabled} onChange={(visible) => api.commit(setBlockHidden(api.site, api.path, section.id, block.id, !visible), true)} />
        <DeviceVisibility hideOn={block.hideOn} disabled={disabled} onChange={(device, hidden) => api.commit(setBlockHideOn(api.site, api.path, section.id, block.id, device, hidden), true)} />
      </Group>
      <Group title="Scrolling">
        <Toggle label="Stay in view while scrolling" hint="Only one item per page can stay pinned." checked={Boolean(block.pin)} disabled={disabled} onChange={(value) => api.commit(pinBlock(api.site, api.path, section.id, block.id, value), true)} />
      </Group>
    </>
  );
}
