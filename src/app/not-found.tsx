export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <h1 className="font-serif text-4xl">That page is not available</h1>
      <p className="mt-3 text-[var(--muted)]">If you were opening a website, it may not be assigned to this account.</p>
    </main>
  );
}
