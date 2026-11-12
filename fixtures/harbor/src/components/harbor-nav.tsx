import Link from "next/link";

const links = [
  { href: "/work", label: "Work" },
  { href: "/studio", label: "Studio" },
  { href: "/journal", label: "Journal" },
  { href: "/visit", label: "Visit" },
];

export function HarborNav() {
  return (
    <nav aria-label="Primary">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
