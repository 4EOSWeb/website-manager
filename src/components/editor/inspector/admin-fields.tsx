"use client";

import { Field } from "@/components/editor/ui";
import { adminLabels } from "@/components/editor/inspector/mode-filter";

/** Read-only adapter, lock, and embed details. Omitted entirely for other roles. */
export function AdminFields(props: {
  experience: string;
  canAdminister: boolean;
  adapterId: string;
  componentId: string;
  lockId: string;
  providerManaged: boolean;
  embedUrl: string;
  embed: boolean;
}) {
  const labels = adminLabels(props.experience, props.canAdminister, props.embed);
  if (labels.length === 0) return null;
  const values: Record<string, string> = {
    "Adapter id": props.adapterId,
    "Component id": props.componentId,
    "Lock id": props.lockId,
    "Provider-managed": props.providerManaged ? "Yes" : "No",
    "Embed URL": props.embedUrl,
  };
  return (
    <div data-admin-fields="readonly">
      {labels.map((label) => (
        <Field key={label} label={label}>
          <input className="ed-input" aria-label={label} value={values[label] ?? ""} readOnly />
        </Field>
      ))}
    </div>
  );
}
