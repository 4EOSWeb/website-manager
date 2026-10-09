"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { contact, primaryNav } from "@/content/site";
import { extraNav } from "@/lib/editor-nav";
import { isActivePath } from "@/components/site/nav-links";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = [...primaryNav, { label: "Contact", href: "/contact" }, ...extraNav()];
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  }, [open, lenis]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden" aria-controls="mobile-menu">
          <MenuIcon aria-hidden="true" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent id="mobile-menu" data-lenis-prevent side="right" className="w-full gap-0 border-l-0 bg-paper p-0 sm:max-w-md">
        <div className="flex h-[var(--header-h)] items-center border-b border-stone px-6">
          <SheetTitle className="eyebrow text-muted-foreground">Menu</SheetTitle>
        </div>
        <SheetDescription className="sr-only">Site navigation and contact details</SheetDescription>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 py-4">
          <ul>
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href} className="border-b border-stone">
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("flex min-h-14 items-center justify-between py-3 font-serif text-2xl text-ink", active && "text-plum")}
                    >
                      {item.label}
                      {active && (
                        <span className="eyebrow text-green-800" aria-hidden="true">
                          Current
                        </span>
                      )}
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-stone bg-[#efebe4] px-6 py-6 text-[0.9375rem]">
          <p className="eyebrow mb-3 text-muted-foreground">Talk to us</p>
          <ul className="space-y-1">
            <li>
              <a href={contact.phoneHref} className="inline-flex min-h-11 items-center font-semibold text-ink">
                {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={contact.emailHref} className="inline-flex min-h-11 items-center font-semibold text-ink">
                {contact.email}
              </a>
            </li>
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
