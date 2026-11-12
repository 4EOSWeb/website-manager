"use client";

export function ProductErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="product-form">
      <h1>This page did not load.</h1>
      <p className="product-quiet">The page stopped before it could finish. Your draft is still saved.</p>
      <button type="button" className="product-button product-button-primary product-button-inline" onClick={onRetry}>
        Try again
      </button>
    </main>
  );
}
