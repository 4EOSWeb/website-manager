"use client";

import { Lock, LockOpen } from "lucide-react";

/** Locks a row. Basic mode can lock. */
export function LayerLockButton(props: { label: string; onLock: () => void }) {
  return (
    <button type="button" className="ed-icon is-small" aria-label={props.label} data-tip="Lock" onClick={props.onLock}>
      <Lock size={13} aria-hidden="true" />
    </button>
  );
}

/** Unlocks a row when the role is allowed. A refused role keeps the button disabled and shows the reason. */
export function LayerUnlockButton(props: { allowed: boolean; reason: string; onUnlock: () => void }) {
  return (
    <button
      type="button"
      className="ed-icon is-small"
      aria-label={props.allowed ? "Unlock" : props.reason}
      title={props.allowed ? "Unlock" : props.reason}
      aria-disabled={props.allowed ? undefined : true}
      disabled={!props.allowed}
      data-tip={props.allowed ? "Unlock" : props.reason}
      onClick={() => {
        if (props.allowed) props.onUnlock();
      }}
    >
      <LockOpen size={13} aria-hidden="true" />
    </button>
  );
}
