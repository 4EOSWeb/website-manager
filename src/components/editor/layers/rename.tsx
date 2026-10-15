"use client";

/** Edits a layer's display name. Enter commits. Escape leaves the name as it was. */
export function LayerRename(props: { value: string; label: string; onCommit: (value: string) => void; onCancel: () => void }) {
  return (
    <input
      className="ed-input is-inline"
      autoFocus
      defaultValue={props.value}
      aria-label={props.label}
      onBlur={(event) => props.onCommit(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          event.preventDefault();
          props.onCancel();
        }
      }}
    />
  );
}
