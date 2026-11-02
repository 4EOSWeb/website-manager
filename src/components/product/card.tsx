import type { ReactNode } from "react";

export function ProductCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="product-card">
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
