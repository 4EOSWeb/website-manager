"use client";

import { Crop, Image as ImageIcon } from "lucide-react";
import { Field, Group, Segmented, TextArea } from "@/components/editor/ui";
import { imageAltWarning } from "@/components/editor/inspector/image-model";

const FOCAL = [null, "top", null, "left", "center", "right", null, "bottom", null] as const;

/** Choose, replace, crop, and alt on Content. Fit and focal on Layout. */
export function ImageFields(props: {
  active: string;
  websiteId: string;
  src: string;
  alt: string;
  fit: "fit" | "fill";
  focal: "center" | "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  onChoose: () => void;
  onCrop: () => void;
  onAlt: (alt: string) => void;
  onFit: (fit: "fit" | "fill") => void;
  onFocal: (focal: "center" | "top" | "bottom" | "left" | "right") => void;
}) {
  if (props.active === "layout") {
    return (
      <div data-image-fields="layout">
        <Group title="Fit">
          <Segmented label="Image fit" value={props.fit} disabled={props.disabled} options={[{ value: "fit", label: "Show all" }, { value: "fill", label: "Fill the space" }]} onChange={props.onFit} />
          <div className="ed-field">
            <span className="ed-field-label">Keep in view when the image is cut off</span>
            <div className="ed-focal" role="radiogroup" aria-label="Part of the image to keep in view">
              {FOCAL.map((spot, index) =>
                spot ? (
                  <button key={spot} type="button" role="radio" aria-checked={props.focal === spot} aria-label={spot.charAt(0).toUpperCase() + spot.slice(1)} disabled={props.disabled} onClick={() => props.onFocal(spot)} />
                ) : (
                  <span key={`gap-${index}`} aria-hidden="true" />
                ),
              )}
            </div>
          </div>
        </Group>
      </div>
    );
  }
  const warning = imageAltWarning(props.src, props.alt);
  const filename = props.src.split("/").pop() ?? "";
  return (
    <div data-image-fields="content">
      <Group title="Image">
        {props.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ed-preview-image" src={`/api/sites/${props.websiteId}/media?name=${encodeURIComponent(filename)}`} alt="" />
        ) : (
          <p className="ed-hint">No image yet. Choose one from your library or upload a new one.</p>
        )}
        <div className="ed-row">
          <button type="button" className="ed-button" disabled={props.disabled} onClick={props.onChoose}>
            <ImageIcon size={14} aria-hidden="true" /> {props.src ? "Replace" : "Choose image"}
          </button>
          {props.src ? (
            <button type="button" className="ed-button" disabled={props.disabled} onClick={props.onCrop}>
              <Crop size={14} aria-hidden="true" /> Crop
            </button>
          ) : null}
        </div>
      </Group>
      <Group title="Alt text">
        <Field label="Describe the picture" count={{ value: props.alt.length, max: 200 }} hint="Say what the picture shows for people who use screen readers. Skip “image of”. Leave empty only if the picture is decoration.">
          <TextArea rows={3} value={props.alt} disabled={props.disabled} maxLength={200} onChange={props.onAlt} />
        </Field>
        {warning ? <p className="ed-callout" role="alert">{warning}</p> : null}
      </Group>
    </div>
  );
}
