"use client";

import { Eye, EyeOff } from "lucide-react";

/** Hide sets visibility.hidden. Show clears it and leaves breakpoint hideOn to the inspector. One click is one undo step. */
export function LayerVisibilityButton(props: { hidden: boolean; label: string; onChange: (hidden: boolean) => void }) {
  return (
    <button
      type="button"
      className="ed-icon is-small"
      aria-label={props.hidden ? `Show ${props.label}` : `Hide ${props.label}`}
      data-tip={props.hidden ? "Show" : "Hide"}
      onClick={() => props.onChange(!props.hidden)}
    >
      {props.hidden ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
    </button>
  );
}
