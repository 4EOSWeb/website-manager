import Link from "next/link";
import type { ReactNode } from "react";

export function ProductCard({ title, className, href, children }: { title?: string; className?: string; href?: string; children: ReactNode }) {
  const classes = ["product-card", className].filter(Boolean).join(" ");
  const body = (
    <>
      {title ? <h2>{title}</h2> : null}
      {children}
    </>
  );
  if (href) return <Link className={classes} href={href}>{body}</Link>;
  return <section className={classes}>{body}</section>;
}
