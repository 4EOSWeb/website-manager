import Link from "next/link";
import { ArrowRightIcon, ExternalLinkIcon, MailIcon, PhoneIcon } from "lucide-react";
import { Rings } from "@/components/brand/rings";
import { Button } from "@/components/ui/button";
import { getFeaturedArticles } from "@/lib/insights";
import { previewMode, type EditorPage, type EditorSection } from "@/lib/editor-site";
import { SectionView } from "@/components/site/section-view";
import { hideClass, styleFor } from "@/components/site/section-style";

type Mark = { start: number; end: number; kind: string; href?: string; color?: string };
type Rich = { text?: string; marks?: Mark[] };
type Block = NonNullable<EditorSection["blocks"]>[number];

function words(value: Rich | string | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value.text ?? "";
}

function RichText({ value, field }: { value: Rich | string | undefined; field: string }) {
  const text = words(value);
  const marks = typeof value === "object" && value?.marks ? value.marks : [];
  if (marks.length === 0) return <span data-field={field} data-rich="true" className="whitespace-pre-line">{text || (previewMode ? "Click to add content" : "")}</span>;
  const points = new Set<number>([0, text.length]);
  for (const mark of marks) {
    points.add(mark.start);
    points.add(mark.end);
  }
  const cuts = [...points].filter((point) => point >= 0 && point <= text.length).sort((a, b) => a - b);
  return (
    <span data-field={field} data-rich="true" className="whitespace-pre-line">
      {cuts.slice(0, -1).map((start, index) => {
        const end = cuts[index + 1] ?? text.length;
        const slice = text.slice(start, end);
        const active = marks.filter((mark) => mark.start <= start && mark.end >= end);
        let node: React.ReactNode = slice;
        if (active.some((mark) => mark.kind === "italic")) node = <em>{node}</em>;
        if (active.some((mark) => mark.kind === "bold")) node = <strong>{node}</strong>;
        if (active.some((mark) => mark.kind === "underline")) node = <u>{node}</u>;
        const color = active.find((mark) => mark.kind === "color")?.color;
        const link = active.find((mark) => mark.kind === "link");
        if (color) node = <span style={{ color }} data-color={color}>{node}</span>;
        if (link?.href) node = <a href={link.href}>{node}</a>;
        return <span key={`${start}-${end}`}>{node}</span>;
      })}
    </span>
  );
}

const PRESET: Record<string, string> = {
  small: "text-sm",
  body: "text-base",
  lead: "text-lead",
  title: "text-h3",
  display: "text-display",
};

function textClasses(block: Block, fallback: string) {
  const style = block.textStyle ?? {};
  return [
    style.preset ? PRESET[style.preset] : fallback,
    style.weight === "regular" ? "font-normal" : style.weight === "medium" ? "font-medium" : style.weight === "bold" ? "font-semibold" : "",
    style.leading === "tight" ? "leading-tight" : style.leading === "loose" ? "leading-relaxed" : style.leading === "normal" ? "leading-normal" : "",
    style.tracking === "tight" ? "tracking-tight" : style.tracking === "wide" ? "tracking-wide" : style.tracking === "normal" ? "tracking-normal" : "",
    style.align === "center" ? "text-center mx-auto" : style.align === "end" ? "text-right ml-auto" : "",
  ].join(" ");
}

function blockHide(block: Block) {
  const hide = block.hideOn ?? [];
  return [
    hide.includes("desktop") ? "lg:hidden" : "",
    hide.includes("tablet") ? "max-lg:hidden sm:max-md:hidden" : "",
    hide.includes("mobile") ? "sm:max-md:hidden max-sm:hidden" : "",
  ].join(" ");
}

function lines(value: Rich | string | undefined) {
  return words(value).split("\n");
}

function ButtonIcon({ icon }: { icon: Block["icon"] }) {
  if (icon === "none") return null;
  if (icon === "external") return <ExternalLinkIcon aria-hidden="true" />;
  if (icon === "mail") return <MailIcon aria-hidden="true" />;
  if (icon === "phone") return <PhoneIcon aria-hidden="true" />;
  return <ArrowRightIcon aria-hidden="true" />;
}

function BlockView({ block, fluid }: { block: Block; fluid: boolean }) {
  if (block.hidden && !previewMode) return null;
  const placed = fluid && block.desktop;
  const box = placed
    ? {
        position: "absolute" as const,
        left: `${(block.desktop?.x ?? 0) * 100}%`,
        top: `${(block.desktop?.y ?? 0) * 100}%`,
        width: `${(block.desktop?.w ?? 0.3) * 100}%`,
        zIndex: block.zIndex ?? 1,
      }
    : undefined;
  const fit = block.fit === "fill" ? "h-full w-full object-cover" : "h-auto max-w-full";
  const color = block.textStyle?.color ? { color: block.textStyle.color } : undefined;
  const align = block.align === "center" ? "flex justify-center" : block.align === "end" ? "flex justify-end" : "";
  const headingTag = block.textStyle?.tag === "h1" ? "h1" : block.textStyle?.tag === "h3" ? "h3" : "h2";
  const Heading = headingTag;
  const imageWidth = block.width === "s" ? "max-w-xs" : block.width === "m" ? "max-w-md" : block.width === "l" ? "max-w-2xl" : "";
  const external = block.target === "new";
  return (
    <div
      data-item-id={block.id}
      data-block-id={block.id}
      data-kind={previewMode ? block.kind : undefined}
      data-editor-name={previewMode ? block.editorName || undefined : undefined}
      data-hidden={block.hidden ? "true" : undefined}
      data-item-locked={block.locked ? "true" : undefined}
      className={[block.pin ? "sticky top-24 z-20" : "", blockHide(block), block.kind === "button" || block.kind === "image" ? align : ""].join(" ").trim() || undefined}
      style={box}
    >
      {block.kind === "brand-mark" ? (
        <div data-locked="provider">
          <Rings intro className="w-full" />
        </div>
      ) : null}
      {block.kind === "eyebrow" ? <p className={`eyebrow ${color ? "" : "text-plum"} ${textClasses(block, "")}`} style={color}><RichText value={block.text} field="text" /></p> : null}
      {block.kind === "heading" ? <Heading className={`max-w-[22ch] ${textClasses(block, headingTag === "h1" ? "text-display" : headingTag === "h3" ? "text-h3" : "text-h2")}`} style={color}><RichText value={block.text} field="text" /></Heading> : null}
      {block.kind === "paragraph" ? <p className={`max-w-[62ch] ${color ? "" : "text-ink/80"} ${textClasses(block, "text-lead")}`} style={color}><RichText value={block.text} field="text" /></p> : null}
      {block.kind === "button" ? (
        <Button asChild size={block.size === "s" ? "sm" : block.size === "m" ? "default" : "lg"} variant={block.variant === "outline" ? "outline" : block.variant === "text" ? "link" : "default"}>
          <Link href={block.href || "/contact"} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
            <RichText value={block.text} field="text" />
            <ButtonIcon icon={block.icon} />
          </Link>
        </Button>
      ) : null}
      {block.kind === "link" ? (
        <Link href={block.href || "/"} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={`font-medium text-ink hover:text-plum hover:underline ${textClasses(block, "")}`} style={color}>
          <RichText value={block.text} field="text" />
        </Link>
      ) : null}
      {block.kind === "card" || block.kind === "person" ? (
        <article className={textClasses(block, "")}>
          <h3 className="text-h3" style={color}><RichText value={block.text} field="text" /></h3>
          {block.detail ? <p className="mt-2 text-muted-foreground"><RichText value={block.detail} field="detail" /></p> : null}
        </article>
      ) : null}
      {block.kind === "quote" ? (
        <blockquote className={textClasses(block, "")}>
          <p className="font-serif text-2xl" style={color}><RichText value={block.text} field="text" /></p>
          {block.detail ? <footer className="mt-3 text-sm text-muted-foreground"><RichText value={block.detail} field="detail" /></footer> : null}
        </blockquote>
      ) : null}
      {block.kind === "image" && block.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.src} alt={block.alt || ""} className={`${fit} ${imageWidth}`} data-field="alt" style={{ objectPosition: block.focal || "center" }} />
      ) : null}
      {block.kind === "image" && !block.src && previewMode ? <p className="border border-dashed border-stone px-4 py-8 text-center text-sm text-muted-foreground" data-image="true">Add your first image</p> : null}
      {block.kind === "list" ? (
        block.listStyle === "number" ? (
          <ol className={`grid list-decimal gap-2 pl-6 ${textClasses(block, "")}`} style={color}>
            {lines(block.text).map((line, index) => <li key={index}><span data-field={`line.${index}`}>{line || (previewMode ? "List item" : "")}</span></li>)}
          </ol>
        ) : (
          <ul className={`grid list-disc gap-2 pl-6 ${textClasses(block, "")}`} style={color}>
            {lines(block.text).map((line, index) => <li key={index}><span data-field={`line.${index}`}>{line || (previewMode ? "List item" : "")}</span></li>)}
          </ul>
        )
      ) : null}
      {block.kind === "insights" ? <InsightsList label={words(block.text)} /> : null}
    </div>
  );
}

function InsightsList({ label }: { label: string }) {
  const articles = getFeaturedArticles();
  return (
    <div>
      <p className="eyebrow mb-3">{label || "Latest insights"}</p>
      <ul className="grid gap-3">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link href={`/insights/${article.slug}`} className="text-h3 hover:text-plum">{article.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroLayout({ section }: { section: EditorSection }) {
  const blocks = section.blocks ?? [];
  const pick = (kind: string, skip = 0) => blocks.filter((item) => item.kind === kind)[skip];
  const eyebrow = pick("eyebrow");
  const heading = pick("heading");
  const paragraph = pick("paragraph");
  const buttons = blocks.filter((item) => item.kind === "button");
  const rings = pick("brand-mark");
  const rest = blocks.filter((item) => !["eyebrow", "heading", "paragraph", "button", "brand-mark"].includes(item.kind));
  return (
    <div className="container-page grid items-center gap-8 pt-12 pb-14 md:pt-20 md:pb-20 lg:grid-cols-12">
      <div className="lg:col-span-7">
        {eyebrow ? <BlockView block={eyebrow} fluid={false} /> : null}
        {heading ? (
          <h1 id="home-title" className="text-display max-w-[13ch]" data-item-id={heading.id} data-block-id={heading.id} data-kind={previewMode ? "heading" : undefined}>
            <RichText value={heading.text} field="text" />
          </h1>
        ) : null}
        {paragraph ? <div className="mt-7"><BlockView block={paragraph} fluid={false} /></div> : null}
        <div className="mt-9 flex flex-wrap gap-3">
          {buttons.map((block) => <BlockView key={block.id} block={block} fluid={false} />)}
        </div>
        {rest.map((block) => <BlockView key={block.id} block={block} fluid={false} />)}
      </div>
      {rings ? (
        <div className="relative mx-auto hidden w-full max-w-[460px] sm:block lg:col-span-5">
          <BlockView block={{ ...rings, id: rings.id }} fluid={false} />
        </div>
      ) : null}
    </div>
  );
}

export function FlowSection({ section }: { section: EditorSection }) {
  if (section.type !== "flow" || !section.blocks) return null;
  if (section.hidden && !previewMode) return null;
  const fluid = section.layout === "fluid";
  const tone = section.layout === "cta" ? "bg-[#231a25] text-[#f7f5f0]" : section.layout === "band" ? "border-b border-stone bg-[#efebe4]" : "border-b border-stone";
  return (
    <section
      data-section-id={section.id}
      data-section-type="flow"
      data-layout={section.layout || "stack"}
      data-editor-name={previewMode ? section.editorName || undefined : undefined}
      data-hidden={section.hidden ? "true" : undefined}
      className={`relative ${tone} ${hideClass(section)} ${section.hidden ? "opacity-60" : ""}`}
      style={styleFor(section)}
    >
      {section.layout === "hero" ? <HeroLayout section={section} /> : null}
      {section.layout === "band" ? (
        <div className="container-page flex flex-col gap-3 py-5 md:flex-row md:flex-wrap md:items-baseline md:gap-8">
          {section.blocks.map((block) => <BlockView key={block.id} block={block} fluid={false} />)}
        </div>
      ) : null}
      {section.layout !== "hero" && section.layout !== "band" ? (
        <div className={`${section.style?.width === "full" ? "w-full px-6 md:px-10" : "container-page"} ${section.style?.align === "center" ? "text-center justify-items-center" : ""} py-16 ${fluid ? "relative min-h-80" : ""} ${section.layout === "cards" || section.layout === "quotes" ? "grid gap-8 md:grid-cols-3" : "grid gap-6"} ${section.layout === "split" ? "lg:grid-cols-2" : ""}`}>
          {section.blocks.map((block) => <BlockView key={block.id} block={block} fluid={fluid} />)}
        </div>
      ) : null}
    </section>
  );
}

export function PageCanvas({ page }: { page: EditorPage }) {
  return (
    <>
      {page.archived && previewMode ? <p className="container-page py-3 text-sm">This page is archived. It stays off the public site until you restore it.</p> : null}
      {page.sections.length === 0 && previewMode ? <div data-empty-page="true" className="min-h-40" /> : null}
      {page.sections.map((section) =>
        section.type === "flow" ? <FlowSection key={section.id} section={section} /> : <SectionView key={section.id} section={section} />,
      )}
    </>
  );
}
