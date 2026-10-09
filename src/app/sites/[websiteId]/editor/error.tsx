"use client";

export default function EditorError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="studio grid h-dvh place-items-center p-6">
      <div className="max-w-md">
        <h1 className="text-lg font-semibold">The editor could not open</h1>
        <p className="mt-2 leading-relaxed text-[var(--studio-muted)]">
          Your saved draft is safe. This is usually a short connection problem with the website preview.
        </p>
        <div className="mt-4 flex gap-2">
          <button className="studio-primary" type="button" onClick={reset}>Try again</button>
          <a className="studio-secondary" href="/sites">Back to websites</a>
        </div>
      </div>
    </div>
  );
}
