import type { ReactNode } from "react";

export function ProductEmpty({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="product-empty" aria-label={label}>
      <svg className="product-empty-mark" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="7" width="30" height="34" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 18h16M16 25h10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {children}
    </section>
  );
}
