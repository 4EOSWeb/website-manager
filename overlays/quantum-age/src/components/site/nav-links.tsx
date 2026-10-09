"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/content/site";
import { extraNav } from "@/lib/editor-nav";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinksList({ pathname, items }: { pathname: string | null; items?: { label: string; href: string; children?: { label: string; href: string }[] }[] }) {
  const links = items ?? [...primaryNav, ...extraNav()].map((item) => ({ ...item, children: [] as { label: string; href: string }[] }));
  return (
    <ul className="flex items-center gap-1 xl:gap-2">
      {links.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href} className="group relative">
            <Link
              href={item.href}
              data-nav-route={item.href}
              data-field="navLabel"
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-11 items-center px-3 text-[0.9375rem] font-medium text-ink/80 transition-colors hover:text-ink",
                "after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-plum after:transition-transform after:duration-200 hover:after:scale-x-100",
                active && "text-ink after:scale-x-100 after:bg-green",
              )}
            >
              {item.label}
            </Link>
            {item.children && item.children.length > 0 ? (
              <ul className="absolute z-20 hidden min-w-48 border border-stone bg-paper p-2 group-hover:block">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link href={child.href} data-nav-route={child.href} data-field="navLabel" className="block px-3 py-2 hover:text-plum">{child.label}</Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function NavLinks({ items }: { items?: { label: string; href: string; children?: { label: string; href: string }[] }[] }) {
  const pathname = usePathname();
  return <NavLinksList pathname={pathname} items={items} />;
}
