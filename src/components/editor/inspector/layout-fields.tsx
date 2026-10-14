"use client";

import { useState } from "react";
import { gridColumns } from "@/platform/document/layout-grid";
import { Field } from "@/components/editor/ui";
import { layoutSettingKeys, pendingLayoutMode, type LayoutModeName } from "@/components/editor/inspector/layout-model";
import type { LayoutSettings } from "@/platform/document/layout";

const modes: LayoutModeName[] = ["Flow", "Stack", "Grid", "Canvas"];

function readSetting(layout: LayoutSettings | undefined, key: string): string {
  if (!layout) return "";
  const value = (layout as Record<string, unknown>)[key];
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" || typeof value === "string") return String(value);
  return "";
}

/** Layout mode and the settings for the current mode. A disallowed component renders nothing. */
export function LayoutFields(props: {
  mode: LayoutModeName;
  allowed: boolean;
  locked?: boolean;
  layout?: LayoutSettings;
  onConfirm: (mode: LayoutModeName) => void;
  onSetting: (key: string, value: string | number | boolean) => void;
}) {
  const [pending, setPending] = useState<LayoutModeName | null>(null);
  if (!props.allowed) return null;
  if (props.locked) return <p className="ed-note" data-layout-lock="mode">This page keeps its layout.</p>;
  const keys = layoutSettingKeys(props.mode);
  return (
    <div data-layout-fields="mode">
      <Field label="Layout mode">
        <select
          className="ed-input"
          aria-label="Layout mode"
          value={props.mode}
          onChange={(event) => setPending(pendingLayoutMode(props.mode, event.target.value))}
        >
          {modes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
        </select>
      </Field>
      {pending ? (
        <div role="alertdialog" aria-label="Change layout" data-layout-confirm="open">
          <p>Changing the layout can change how this section behaves on smaller screens.</p>
          <button type="button" onClick={() => setPending(null)}>Cancel</button>
          <button type="button" onClick={() => { props.onConfirm(pending); setPending(null); }}>Change layout</button>
        </div>
      ) : null}
      {keys.map((key) => {
        const value = readSetting(props.layout, key);
        if (key === "wrap" || key === "showGrid") {
          return (
            <Field key={key} label={key === "showGrid" ? "Show grid" : "Wrap"}>
              <input
                type="checkbox"
                aria-label={key === "showGrid" ? "Show grid" : "Wrap"}
                data-layout-setting={key}
                checked={value === "true"}
                onChange={(event) => props.onSetting(key, event.target.checked)}
              />
            </Field>
          );
        }
        if (key === "gap" || key === "snap") {
          return (
            <Field key={key} label={key === "snap" ? "Snap" : "Gap"}>
              <input
                className="ed-input"
                type="number"
                aria-label={key === "snap" ? "Snap" : "Gap"}
                data-layout-setting={key}
                value={value}
                onChange={(event) => props.onSetting(key, Number(event.target.value))}
              />
            </Field>
          );
        }
        const options = key === "columns" ? gridColumns.map(String)
          : key === "direction" && props.mode === "Flow" ? ["vertical", "horizontal"]
          : key === "direction" ? ["column", "row"]
          : key === "justify" ? ["start", "center", "end", "between"]
          : ["start", "center", "end", "stretch"];
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        return (
          <Field key={key} label={label}>
            <select className="ed-input" aria-label={label} data-layout-setting={key} value={value} onChange={(event) => props.onSetting(key, key === "columns" ? Number(event.target.value) : event.target.value)}>
              {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </Field>
        );
      })}
    </div>
  );
}
