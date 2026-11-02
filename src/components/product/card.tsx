import type { ReactNode } from "react";

export function ProductCard({ title, className, children }: { title?: string; className?: string; children: ReactNode }) {
  const classes = ["product-card", className].filter(Boolean).join(" ");
  return (
    <section className={classes}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
