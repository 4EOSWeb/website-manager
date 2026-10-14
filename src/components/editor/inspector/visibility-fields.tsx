"use client";

import { Toggle } from "@/components/editor/ui";
import { hiddenDevices, visibilityDevices, type VisibilityDevice, type VisibilityState } from "@/components/editor/inspector/visibility-model";

const labels: Record<VisibilityDevice, string> = {
  desktop: "Hide on desktop",
  tablet: "Hide on tablet",
  mobile: "Hide on mobile",
};

/** Per-breakpoint hide switches. All three become a fully hidden node. */
export function VisibilityFields(props: { visibility: VisibilityState; onToggle: (device: VisibilityDevice, hidden: boolean) => void }) {
  const hidden = new Set(hiddenDevices(props.visibility));
  return (
    <div data-visibility-fields="hide">
      {visibilityDevices.map((device) => (
        <Toggle key={device} label={labels[device]} checked={hidden.has(device)} onChange={(value) => props.onToggle(device, value)} />
      ))}
    </div>
  );
}
