"use client";

import { useState } from "react";
import type { SiteDraft } from "@/lib/content-schema";
import { Field, Group, Segmented, Select, TextInput, Toggle } from "@/components/editor/ui";
import { LinkPicker } from "@/components/editor/inspector/shared";
import { VisibilityFields } from "@/components/editor/inspector/visibility-fields";
import { acceptLink, linkTarget } from "@/components/editor/inspector/link-model";
import { buttonStateRecord, type ButtonStateName } from "@/components/editor/inspector/button-model";
import type { VisibilityDevice, VisibilityState } from "@/components/editor/inspector/visibility-model";

const states: { value: ButtonStateName; label: string }[] = [
  { value: "hover", label: "Hover" },
  { value: "focus", label: "Focus" },
  { value: "disabled", label: "Disabled" },
];

/** Label, link, look, and state objects for one generated button. State edits stay on this node. */
export function ButtonFields(props: {
  site: SiteDraft;
  label: string;
  href: string;
  target: "same" | "new";
  variant: string;
  size: string;
  font: string;
  color: string;
  background: string;
  border: string;
  radius: string;
  padding: string;
  icon: string;
  iconPosition: string;
  align: string;
  width: string;
  fonts: string[];
  nodeProps: Record<string, unknown>;
  visibility?: VisibilityState | null;
  onChange: (key: string, value: string) => void;
  onState: (state: ButtonStateName, key: string, value: string) => void;
  onVisibility?: (device: VisibilityDevice, hidden: boolean) => void;
}) {
  const [state, setState] = useState<ButtonStateName>("hover");
  const stateValues = buttonStateRecord(props.nodeProps, state);
  return (
    <div data-button-fields="props">
      <Group title="Label">
        <Field label="Button text">
          <TextInput value={props.label} onChange={(value) => props.onChange("label", value.replace(/\n/g, " "))} />
        </Field>
      </Group>
      <Group title="Link">
        <LinkPicker site={props.site} value={props.href} onChange={(href) => { const next = acceptLink(href); if (next) props.onChange("href", next); }} />
        <Toggle label="Open in a new tab" checked={props.target === "new"} onChange={(value) => props.onChange("target", linkTarget(value))} />
      </Group>
      <Group title="Look">
        <Segmented label="Button look" value={props.variant || "filled"} options={[{ value: "filled", label: "Filled" }, { value: "outline", label: "Outline" }, { value: "text", label: "Text" }]} onChange={(value) => props.onChange("variant", value)} />
        <Segmented label="Button size" value={props.size || "m"} options={[{ value: "s", label: "Small" }, { value: "m", label: "Medium" }, { value: "l", label: "Large" }]} onChange={(value) => props.onChange("size", value)} />
        <Select label="Font" value={props.fonts.includes(props.font) ? props.font : ""} options={[{ value: "", label: "Theme default" }, ...props.fonts.map((family) => ({ value: family, label: family }))]} onChange={(value) => props.onChange("font", value)} />
        <Field label="Text color"><TextInput value={props.color} onChange={(value) => props.onChange("color", value)} /></Field>
        <Field label="Background"><TextInput value={props.background} onChange={(value) => props.onChange("background", value)} /></Field>
        <Field label="Border"><TextInput value={props.border} onChange={(value) => props.onChange("border", value)} /></Field>
        <Field label="Radius"><TextInput value={props.radius} onChange={(value) => props.onChange("radius", value)} /></Field>
        <Field label="Padding"><TextInput value={props.padding} onChange={(value) => props.onChange("padding", value)} /></Field>
      </Group>
      <Group title="Icon">
        <Select label="Icon" value={props.icon || "none"} options={[{ value: "none", label: "No icon" }, { value: "arrow", label: "Arrow" }, { value: "external", label: "Opens elsewhere" }, { value: "mail", label: "Email" }, { value: "phone", label: "Phone" }]} onChange={(value) => props.onChange("icon", value)} />
        <Segmented label="Icon position" value={props.iconPosition || "end"} options={[{ value: "start", label: "Start" }, { value: "end", label: "End" }]} onChange={(value) => props.onChange("iconPosition", value)} />
      </Group>
      <Group title="States">
        <Select label="Button state" value={state} options={states} onChange={setState} />
        <Field label="State background">
          <TextInput value={stateValues.background ?? ""} onChange={(value) => props.onState(state, "background", value)} />
        </Field>
      </Group>
      <Group title="Placement">
        <Segmented label="Button alignment" value={props.align || "start"} options={[{ value: "start", label: "Left" }, { value: "center", label: "Center" }, { value: "end", label: "Right" }]} onChange={(value) => props.onChange("align", value)} />
        <Select label="Width" value={props.width || "auto"} options={[{ value: "auto", label: "Auto" }, { value: "full", label: "Full" }]} onChange={(value) => props.onChange("width", value)} />
      </Group>
      {props.visibility && props.onVisibility ? <VisibilityFields visibility={props.visibility} onToggle={props.onVisibility} /> : null}
    </div>
  );
}
