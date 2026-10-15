"use client";

import { DragStatus, type DragRejectReason } from "@/components/editor/drag-status";

/** The invalid-drop reason, shown in the layers panel. */
export function LayerReparentNote(props: { reason: DragRejectReason | null }) {
  return <DragStatus reason={props.reason} />;
}
