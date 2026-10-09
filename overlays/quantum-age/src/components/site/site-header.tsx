import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Logo } from "@/components/site/logo";
import { NavLinks, NavLinksList } from "@/components/site/nav-links";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { previewMode, readSite, type EditorPage } from "@/lib/editor-site";

export function PrototypeBanner() {
  return (
    <div className="bg-notice-bg text-notice" data-editor-chrome={previewMode ? "banner" : undefined}>
      <p className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm">
        <span>This is a preview. The live site changes only after a person accepts the review.</span>
        <Link href="/prototype-notes" className="link-underline font-semibold">
          About this prototype
        </Link>
      </p>
    </div>
  );
}

function menuItems(pages: EditorPage[]) {
  const visible = pages.filter((page) => page.navVisible && !page.archived && page.route !== "/");
  return visible
    .filter((page) => !page.parentRoute)
    .map((page) => ({
      label: page.navLabel || page.title,
      href: page.route,
      children: visible.filter((child) => child.parentRoute === page.route).map((child) => ({ label: child.navLabel || child.title, href: child.route })),
    }));
}

export async function SiteHeader() {
  const { pages, chrome } = readSite();
  const hidesSomewhere = pages.some((page) => page.hideHeader) || Boolean(chrome?.header.hiddenOn.length);
  // Only read the request path when a page can hide the header, so the default
  // site stays statically prerendered.
  const path = hidesSomewhere ? (await headers()).get("x-4eos-path") ?? "" : "";
  const current = pages.find((page) => page.route === path);
  if (current?.hideHeader || chrome?.header.hiddenOn.includes(path)) return null;
  const items = menuItems(pages);
  const flat = items.flatMap((item) => [item, ...item.children]);
  const buttonLabel = chrome?.header.buttonLabel || "Start a conversation";
  const buttonHref = chrome?.header.buttonHref || "/contact";
  return (
    <header className={`${chrome?.header.sticky === false ? "" : "sticky"} site-header top-0 z-40 border-b border-stone bg-paper`} data-chrome="header">
      {chrome?.announcement.enabled && chrome.announcement.text ? (
        <p className="bg-plum px-4 py-2 text-center text-sm text-white" data-field="announcement">
          {chrome.announcement.href ? <a href={chrome.announcement.href}>{chrome.announcement.text}</a> : chrome.announcement.text}
        </p>
      ) : null}
      <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-6">
        <Logo priority />
        <nav aria-label="Primary" className={chrome?.header.phoneCompact ? "hidden lg:block" : "block"}>
          <Suspense fallback={<NavLinksList pathname={null} items={items} />}>
            <NavLinks items={items} />
          </Suspense>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild className="hidden lg:inline-flex">
            <Link href={buttonHref} data-field="buttonLabel" data-chrome-field="buttonLabel">{buttonLabel}</Link>
          </Button>
          <Suspense fallback={null}>
            <MobileNav items={flat} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
