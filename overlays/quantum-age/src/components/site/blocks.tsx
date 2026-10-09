"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contact } from "@/content/site";
import { designedCopy } from "@/lib/editor-nav";
import { useEditorPreview } from "@/components/site/editor-preview-flag";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  className,
  aside,
}: {
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  aside?: React.ReactNode;
}) {
  const path = usePathname() || "";
  const preview = useEditorPreview();
  const designed = designedCopy(path);
  const shownTitle = designed?.title || title;
  const shownLead = designed?.lead;
  const hidden = designed?.hidden;
  return (
    <section data-section-id="designed" data-section-type="designed" data-hidden={hidden ? "true" : undefined} className={cn("border-b border-stone", hidden && "opacity-60", className)} aria-labelledby="page-title">
      <div className="container-page grid gap-10 pt-14 pb-14 md:pt-20 md:pb-20 lg:grid-cols-12">
        <div className={cn(aside ? "lg:col-span-8" : "lg:col-span-10")}>
          {hidden ? <p className="mb-4 text-sm text-muted-foreground">Hidden on the public site</p> : null}
          {eyebrow && <p className="eyebrow mb-5 text-plum">{eyebrow}</p>}
          <h1 id="page-title" className="text-h1 max-w-[18ch]" data-field="title">
            {shownTitle}
          </h1>
          {shownLead ? (
            <div className="text-lead mt-6 max-w-[60ch] text-muted-foreground">
              <p data-field="lead">{shownLead}</p>
            </div>
          ) : lead ? (
            <div className="text-lead mt-6 max-w-[60ch] text-muted-foreground" data-field="lead">{lead}</div>
          ) : preview ? (
            <p className="mt-6 text-sm text-muted-foreground" data-field="lead">Click to add content</p>
          ) : null}
          {children && <div className="mt-8">{children}</div>}
        </div>
        {aside && <div className="lg:col-span-4">{aside}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  className,
  tone = "light",
  field,
  leadField,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
  field?: string;
  leadField?: string;
}) {
  return (
    <div className={cn("reveal", className)}>
      {eyebrow && <p className={cn("eyebrow mb-4", tone === "dark" ? "text-green" : "text-plum")}>{eyebrow}</p>}
      <h2 id={id} data-field={field} className={cn("text-h2 max-w-[22ch]", tone === "dark" && "text-white")}>
        {title}
      </h2>
      {lead && (
        <div data-field={leadField} className={cn("text-lead mt-5 max-w-[56ch]", tone === "dark" ? "text-white/80" : "text-muted-foreground")}>
          {lead}
        </div>
      )}
    </div>
  );
}

export function CtaBand({
  title = "Let's talk about where you want to grow.",
  body = "Tell us what you are working on. We will reply by email or phone.",
  cta = { label: "Start a conversation", href: "/contact" },
  titleField,
  bodyField,
}: {
  title?: string;
  body?: string;
  cta?: { label: string; href: string };
  titleField?: string;
  bodyField?: string;
}) {
  return (
    <section className="on-dark bg-plum-900 text-white" aria-labelledby="cta-heading">
      <div className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h2 id="cta-heading" data-field={titleField} className="text-h2 text-white">
            {title}
          </h2>
          <p data-field={bodyField} className="text-lead mt-5 max-w-[48ch] text-white/80">{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href={cta.href}>
                {cta.label}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
        <dl className="grid gap-6 border-t border-white/15 pt-8 text-[0.9375rem] sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <div>
            <dt className="eyebrow text-green">Call</dt>
            <dd className="mt-2">
              <a href={contact.phoneHref} className="text-lg font-semibold text-white hover:underline">
                {contact.phoneDisplay}
              </a>
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-green">Email</dt>
            <dd className="mt-2">
              <a href={contact.emailHref} className="text-lg font-semibold [overflow-wrap:anywhere] text-white hover:underline">
                {contact.email}
              </a>
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <dt className="sr-only">Reach</dt>
            <dd className="text-white/70">{contact.reach}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function Notice({
  title,
  children,
  tone = "notice",
  className,
  id,
}: {
  title: string;
  children?: React.ReactNode;
  tone?: "notice" | "info";
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      role="note"
      className={cn(
        "flex gap-3 border-l-4 px-4 py-4 text-[0.9375rem]",
        tone === "notice" ? "border-notice bg-notice-bg text-notice" : "border-plum bg-plum-50 text-plum-900",
        className,
      )}
    >
      <InfoIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1">{children}</div>}
      </div>
    </div>
  );
}

export function TextLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex min-h-11 items-center gap-2 font-semibold text-plum hover:text-plum-700", className)}>
      <span className="link-underline">{children}</span>
      <ArrowRightIcon className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
