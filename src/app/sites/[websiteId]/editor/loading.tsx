export default function EditorLoading() {
  return (
    <div className="studio grid h-dvh place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <span className="studio-spinner" aria-hidden="true" />
        <p className="text-[var(--studio-muted)]">Opening the editor…</p>
      </div>
    </div>
  );
}
