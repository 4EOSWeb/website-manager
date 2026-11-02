"use client";

import { Field, Group, Segmented, TextInput } from "@/components/editor/ui";

/** Tag, weight, spacing, alignment, and color for one text node. */
export function TextFields(props: {
  tag: string;
  weight: string;
  leading: string;
  tracking: string;
  align: string;
  color: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div data-text-fields="style">
      <Group title="Tag">
        <Segmented label="Tag" value={props.tag || "h2"} options={[{ value: "h1", label: "H1" }, { value: "h2", label: "H2" }, { value: "h3", label: "H3" }, { value: "p", label: "Text" }]} onChange={(value) => props.onChange("tag", value)} />
      </Group>
      <Group title="Weight and spacing">
        <Segmented label="Weight" value={props.weight || "regular"} options={[{ value: "regular", label: "Regular" }, { value: "medium", label: "Medium" }, { value: "bold", label: "Bold" }]} onChange={(value) => props.onChange("weight", value)} />
        <Segmented label="Line spacing" value={props.leading || "normal"} options={[{ value: "tight", label: "Tight" }, { value: "normal", label: "Normal" }, { value: "loose", label: "Loose" }]} onChange={(value) => props.onChange("leading", value)} />
        <Segmented label="Letter spacing" value={props.tracking || "normal"} options={[{ value: "tight", label: "Tight" }, { value: "normal", label: "Normal" }, { value: "wide", label: "Wide" }]} onChange={(value) => props.onChange("tracking", value)} />
      </Group>
      <Group title="Alignment and color">
        <Segmented label="Alignment" value={props.align || "start"} options={[{ value: "start", label: "Left" }, { value: "center", label: "Center" }, { value: "end", label: "Right" }]} onChange={(value) => props.onChange("align", value)} />
        <Field label="Text color">
          <TextInput value={props.color} onChange={(value) => props.onChange("color", value)} />
        </Field>
      </Group>
    </div>
  );
}
