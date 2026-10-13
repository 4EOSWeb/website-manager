"use client";

import { Lock } from "lucide-react";

/** Locks a row. Unlock is a separate step, so this control only sets the lock. */
export function LayerLockButton(props: { label: string; onLock: () => void }) {
  return (
    <button type="button" className="ed-icon is-small" aria-label={props.label} data-tip="Lock" onClick={props.onLock}>
      <Lock size={13} aria-hidden="true" />
    </button>
  );
}
