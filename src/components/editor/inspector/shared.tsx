"use client";

import { useState } from "react";
import { THEME_COLORS } from "@/lib/rich-text";
import { linkProblem } from "@/lib/links";
import type { SiteDraft } from "@/lib/content-schema";
import { Field, Select, TextInput, Toggle } from "@/components/editor/ui";

export const COLOR_NAMES: Record<string, string> = {
  "#1c1915": "Ink",
  "#5c3d6e": "Plum",
  "#3f6b4a": "Green",
  "#8c4a2f": "Copper",
  "#f7f4ef": "Paper",
  "#ffffff": "White",
};

export const THEME_SWATCHES = THEME_COLORS.map((value) => ({ value, name: COLOR_NAMES[value] ?? value }));

export const DEVICE_LABELS = { desktop: "Desktop", tablet: "Tablet", mobile: "Phone" } as const;

export function LinkPicker(props: { site: SiteDraft; value: string; onChange: (href: string) => void; disabled?: boolean; label?: string }) {
  const pages = props.site.pages.filter((page) => !page.archived);
  const matches = pages.some((page) => page.route === props.value);
  const [custom, setCustom] = useState(!matches && props.value !== "");
  const [draft, setDraft] = useState(props.value);
  const problem = custom ? linkProblem(draft) : "";
  return (
    <div className="ed-stack">
      <Field label={props.label ?? "Link to"}>
        <Select
          label={props.label ?? "Link to"}
          disabled={props.disabled}
          value={custom ? "__custom" : props.value || pages[0]?.route || "/"}
          options={[...pages.map((page) => ({ value: page.route, label: `${page.title} (${page.route})` })), { value: "__custom", label: "Another address…" }]}
          onChange={(value) => {
            if (value === "__custom") {
              setCustom(true);
              return;
            }
            setCustom(false);
            setDraft(value);
            props.onChange(value);
          }}
        />
      </Field>
      {custom ? (
        <Field label="Address" hint={problem || "Opens exactly this address."}>
          <TextInput
            value={draft}
            placeholder="https://example.com or mailto:hello@example.com"
            disabled={props.disabled}
            onChange={(value) => {
              setDraft(value);
              if (!linkProblem(value)) props.onChange(value.trim());
            }}
          />
        </Field>
      ) : null}
    </div>
  );
}

export function DeviceVisibility(props: { hideOn: string[] | undefined; onChange: (device: "desktop" | "tablet" | "mobile", hidden: boolean) => void; disabled?: boolean }) {
  return (
    <div className="ed-stack">
      {(["desktop", "tablet", "mobile"] as const).map((device) => (
        <Toggle
          key={device}
          label={`Show on ${DEVICE_LABELS[device].toLowerCase()}`}
          checked={!(props.hideOn ?? []).includes(device)}
          disabled={props.disabled}
          onChange={(visible) => props.onChange(device, !visible)}
        />
      ))}
    </div>
  );
}
