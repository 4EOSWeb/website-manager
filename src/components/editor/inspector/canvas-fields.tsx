"use client";

import { Field, Group, Select, TextInput } from "@/components/editor/ui";
import { CANVAS_ANCHORS, type CanvasAnchor } from "@/components/editor/inspector/canvas-model";

/** Percent position, anchor, and z-order for a canvas child. Hidden for any other parent. */
export function CanvasFields(props: {
  visible: boolean;
  showPosition?: boolean;
  showOrder?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  anchor: CanvasAnchor;
  onPercent: (key: "x" | "y" | "w" | "h", raw: string) => void;
  onAnchor: (anchor: CanvasAnchor) => void;
  onOrder: (action: "forward" | "front" | "backward" | "back") => void;
}) {
  if (!props.visible) return null;
  const position = props.showPosition !== false;
  const order = props.showOrder !== false;
  return (
    <div data-canvas-fields="box">
      {position ? <Group title="Position">
        <Field label="X"><TextInput value={String(props.x)} onChange={(value) => props.onPercent("x", value)} /></Field>
        <Field label="Y"><TextInput value={String(props.y)} onChange={(value) => props.onPercent("y", value)} /></Field>
        <Field label="Width"><TextInput value={String(props.w)} onChange={(value) => props.onPercent("w", value)} /></Field>
        <Field label="Height"><TextInput value={String(props.h)} onChange={(value) => props.onPercent("h", value)} /></Field>
        <Select label="Anchor" value={props.anchor} options={CANVAS_ANCHORS.map((anchor) => ({ value: anchor, label: anchor }))} onChange={props.onAnchor} />
      </Group> : null}
      {order ? <Group title="Z-index">
        <div className="ed-row" data-field="z-index">
          <button type="button" className="ed-button" onClick={() => props.onOrder("forward")}>Bring forward</button>
          <button type="button" className="ed-button" onClick={() => props.onOrder("front")}>Bring to front</button>
          <button type="button" className="ed-button" onClick={() => props.onOrder("backward")}>Send backward</button>
          <button type="button" className="ed-button" onClick={() => props.onOrder("back")}>Send to back</button>
        </div>
      </Group> : null}
    </div>
  );
}
