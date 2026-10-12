export type DragRejectReason = "locked" | "parent_rejected";

export function dragRejectReason(value: string): DragRejectReason | null {
  if (value === "locked" || value === "parent_rejected") return value;
  return null;
}

export function dragStatusMessage(reason: DragRejectReason): string {
  return reason === "locked" ? "This item is locked." : "This item cannot go there.";
}

export function DragStatus(props: { reason: DragRejectReason | null }) {
  if (!props.reason) return null;
  return (
    <p className="ed-drag-status" role="status">
      {dragStatusMessage(props.reason)}
    </p>
  );
}
