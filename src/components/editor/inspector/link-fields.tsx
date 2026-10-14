"use client";

import type { SiteDraft } from "@/lib/content-schema";
import { Toggle } from "@/components/editor/ui";
import { LinkPicker } from "@/components/editor/inspector/shared";
import { acceptLink, linkTarget } from "@/components/editor/inspector/link-model";

/** Destination and new-tab for a generated link or button. Invalid addresses are not saved. */
export function LinkFields(props: { site: SiteDraft; href: string; target: "same" | "new"; onHref: (href: string) => void; onTarget: (target: "same" | "new") => void }) {
  return (
    <div data-link-fields="href">
      <LinkPicker site={props.site} value={props.href} onChange={(href) => { const next = acceptLink(href); if (next) props.onHref(next); }} />
      <Toggle label="Open in a new tab" checked={props.target === "new"} onChange={(value) => props.onTarget(linkTarget(value))} />
    </div>
  );
}
