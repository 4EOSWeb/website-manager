"use client";

import { Eye, EyeOff } from "lucide-react";

/** Hides or shows a row. The row stays in the tree either way. */
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
