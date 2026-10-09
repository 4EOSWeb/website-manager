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

export function NavLinksList({ pathname }: { pathname: string | null }) {
  const items = [...primaryNav, ...extraNav()];
  return (
    <ul className="flex items-center gap-1 xl:gap-2">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-11 items-center px-3 text-[0.9375rem] font-medium text-ink/80 transition-colors hover:text-ink",
                "after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-plum after:transition-transform after:duration-200 hover:after:scale-x-100",
                active && "text-ink after:scale-x-100 after:bg-green",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function NavLinks() {
  const pathname = usePathname();
  return <NavLinksList pathname={pathname} />;
}
