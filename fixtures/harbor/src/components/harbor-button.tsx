import Link from "next/link";

export function HarborTextButton({ href, children }: { href: string; children: string }) {
  return (
    <Link className="harbor-text-button" href={href}>
      {children}
    </Link>
  );
}

export function HarborPillButton({ href, children }: { href: string; children: string }) {
  return (
    <Link className="harbor-pill-button" href={href}>
      {children}
    </Link>
  );
}
