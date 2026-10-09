import type { CSSProperties } from "react";
import type { EditorSection, Share } from "@/lib/editor-site";
import { previewMode } from "@/lib/editor-site";
import { hideClass, styleFor } from "@/components/site/section-style";

function shares(box: Share | undefined, prefix: string) {
  if (!box) return {};
  return {
    [`--${prefix}x`]: box.x,
    [`--${prefix}y`]: box.y,
    [`--${prefix}w`]: box.w,
    [`--${prefix}h`]: box.h,
  };
}

function Empty({ children }: { children: string }) {
  if (!previewMode) return null;
  return <p className="border border-dashed border-stone px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function videoSrc(url: string) {
  const youtube = url.match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return "";
}

function ZoneItem({ item }: { item: NonNullable<EditorSection["items"]>[number] }) {
  if (item.hidden && !previewMode) return null;
  const style = {
    ...shares(item.desktop, "d"),
    ...shares(item.tablet, "t"),
    ...shares(item.mobile, "m"),
    zIndex: item.zIndex ?? 1,
  } as CSSProperties;
  return (
    <div
      className={`ff-item${item.tablet ? " has-tablet" : ""}${item.mobile ? " has-mobile" : ""}${item.hidden ? " is-hidden" : ""}`}
      style={style}
      data-item-id={item.id}
      data-kind={previewMode ? item.kind : undefined}
      data-group={item.groupId}
      data-item-locked={item.locked ? "true" : undefined}
      data-hidden={item.hidden ? "true" : undefined}
      data-image={item.kind === "image" || item.kind === "graphic" ? "true" : undefined}
    >
      {item.kind === "heading" ? <h3 className="text-h3" data-field="text">{item.text || (previewMode ? "Add a heading" : "")}</h3> : null}
      {item.kind === "text" || item.kind === "callout" ? (
        <p className={item.kind === "callout" ? "border-l-4 border-green bg-[#efebe4] p-4" : ""} data-field="text">
          {item.text || (previewMode ? "Click to add content" : "")}
        </p>
      ) : null}
      {item.kind === "button" ? (
        <a className="inline-flex min-h-11 items-center bg-plum px-4 font-semibold text-white" href={item.href || "/contact"} data-field="text">
          {item.text || "Learn more"}
        </a>
      ) : null}
      {item.kind === "image" || item.kind === "graphic" ? (
        item.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.src} alt={item.alt || ""} className="h-full w-full object-cover" data-field="alt" />
        ) : (
          <Empty>Add your first image</Empty>
        )
      ) : null}
      {item.kind === "testimonial" ? (
        <blockquote className="border-l-4 border-plum pl-4">
          <p data-field="text">{item.text || (previewMode ? "Click to add content" : "")}</p>
          <footer className="mt-2 text-sm" data-field="caption">{item.caption}</footer>
        </blockquote>
      ) : null}
      {item.kind === "promo" ? (
        <div className="bg-plum-900 p-5 text-white">
          <h3 className="font-serif text-2xl" data-field="text">{item.text || "A promotion"}</h3>
          <p className="mt-2 text-white/80" data-field="caption">{item.caption}</p>
        </div>
      ) : null}
    </div>
  );
}

export function FreeformZone({
  id,
  name,
  items,
  overlay,
}: {
  id: string;
  name: string;
  items: NonNullable<EditorSection["items"]>;
  overlay?: boolean;
}) {
  if (overlay && items.length === 0 && !previewMode) return null;
  return (
    <div
      className={overlay ? "ff-zone ff-overlay" : "ff-zone ff-section"}
      data-freeform={id}
      data-overlay={overlay ? "true" : undefined}
      data-zone-name={name}
    >
      <style>{`
        .ff-zone { position: relative; }
        .ff-section { min-height: 22rem; }
        .ff-overlay { position: absolute; inset: 0; pointer-events: none; min-height: 0; }
        .ff-overlay .ff-item { pointer-events: auto; }
        .ff-item { position: absolute; left: calc(var(--dx) * 100%); top: calc(var(--dy) * 100%); width: calc(var(--dw) * 100%); height: calc(var(--dh) * 100%); overflow: auto; }
        .ff-item.is-hidden { opacity: 0.45; }
        @media (max-width: 1099px) {
          .ff-item.has-tablet { left: calc(var(--tx) * 100%); top: calc(var(--ty) * 100%); width: calc(var(--tw) * 100%); height: calc(var(--th) * 100%); }
          .ff-item:not(.has-tablet) { position: static; width: auto; height: auto; margin: 0.75rem 0; }
          .ff-section:not(:has(.has-tablet)) { min-height: 0; }
        }
        @media (max-width: 499px) {
          .ff-item.has-mobile { position: absolute; left: calc(var(--mx) * 100%); top: calc(var(--my) * 100%); width: calc(var(--mw) * 100%); height: calc(var(--mh) * 100%); }
          .ff-item:not(.has-mobile) { position: static; width: auto; height: auto; margin: 0.75rem 0; }
          .ff-section:not(:has(.has-mobile)) { min-height: 0; }
        }
      `}</style>
      {items.length === 0 && overlay && previewMode ? <button type="button" data-zone-hit className="pointer-events-auto absolute bottom-3 left-6 bg-transparent p-0 text-sm text-plum">Click to add content</button> : null}
      {items.length === 0 && !overlay ? <Empty>Click to add content</Empty> : null}
      {items.map((item) => (
        <ZoneItem key={item.id} item={item} />
      ))}
    </div>
  );
}

export function SectionView({ section }: { section: EditorSection }) {
  if (section.hidden && !previewMode) return null;
  const body = renderSection(section);
  return (
    <div data-section-id={section.id} data-section-type={section.type} data-editor-name={previewMode ? section.editorName || undefined : undefined} data-hidden={section.hidden ? "true" : undefined} className={`${hideClass(section)} ${section.hidden ? "opacity-60" : ""}`.trim() || undefined} style={section.style ? styleFor(section) : undefined}>
      {section.hidden && previewMode ? <p className="container-page py-2 text-sm text-muted-foreground">Hidden on the public site</p> : null}
      {body}
    </div>
  );
}

function renderSection(section: EditorSection) {
  if (section.type === "heading") {
    const Tag = section.level === 3 ? "h3" : "h2";
    return (
      <div className="container-page py-8">
        <Tag className="text-h2 max-w-[22ch]" data-field="text">{section.text || (previewMode ? "Add a heading" : "")}</Tag>
      </div>
    );
  }
  if (section.type === "paragraph" || section.type === "text") {
    return (
      <div className="container-page py-4">
        <p className={section.type === "paragraph" ? "text-lead max-w-[62ch] text-ink/80" : "max-w-[62ch]"} data-field="text">
          {section.text || (previewMode ? "Click to add content" : "")}
        </p>
      </div>
    );
  }
  if (section.type === "button") {
    return (
      <div className="container-page py-4">
        <a className="inline-flex min-h-11 items-center gap-2 bg-plum px-5 font-semibold text-white" href={section.href || "/contact"} data-field="label">
          {section.label || "Learn more"}
        </a>
      </div>
    );
  }
  if (section.type === "image") {
    return (
      <figure className="container-page py-6" data-image="true">
        {section.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={section.src} alt={section.alt || ""} className="h-auto w-full max-w-3xl object-cover" data-field="alt" />
        ) : (
          <Empty>Add your first image</Empty>
        )}
        {section.caption ? <figcaption className="mt-2 text-sm text-muted-foreground" data-field="caption">{section.caption}</figcaption> : null}
      </figure>
    );
  }
  if (section.type === "gallery") {
    const images = section.images ?? [];
    return (
      <div className="container-page grid gap-4 py-6 sm:grid-cols-3" data-image="true">
        {images.length === 0 ? <Empty>Add your first image</Empty> : null}
        {images.map((image, index) =>
          image.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${image.src}-${index}`} src={image.src} alt={image.alt || ""} className="h-48 w-full object-cover" data-field={`items.${index}.alt`} />
          ) : null,
        )}
      </div>
    );
  }
  if (section.type === "divider") return <hr className="container-page my-6 border-stone" />;
  if (section.type === "spacer") return <div className={section.size === "l" ? "h-28" : section.size === "s" ? "h-8" : "h-16"} />;
  if (section.type === "quote") {
    return (
      <blockquote className="container-page border-l-4 border-plum py-6 pl-5">
        <p className="font-serif text-2xl" data-field="text">{section.text || (previewMode ? "Click to add content" : "")}</p>
        {section.cite || previewMode ? <footer className="mt-3 text-sm text-muted-foreground" data-field="cite">{section.cite}</footer> : null}
      </blockquote>
    );
  }
  if (section.type === "video") {
    const src = section.url ? videoSrc(section.url) : "";
    return (
      <div className="container-page py-6">
        {src ? <iframe className="aspect-video w-full max-w-3xl border-0" src={src} title="Video" sandbox="allow-scripts allow-popups" /> : <Empty>Add a video link</Empty>}
      </div>
    );
  }
  if (section.type === "cta") {
    return (
      <section className="bg-plum-900 py-16 text-white">
        <div className="container-page">
          <h2 className="text-h2 text-white" data-field="heading">{section.heading}</h2>
          <p className="mt-4 max-w-[48ch] text-white/80" data-field="body">{section.body}</p>
          <a className="mt-8 inline-flex min-h-11 items-center bg-white px-5 font-semibold text-plum" href={section.href || "/contact"} data-field="label">{section.label}</a>
        </div>
      </section>
    );
  }
  if (section.type === "card") {
    return (
      <div className="container-page py-6">
        <article className="max-w-xl border border-stone p-6">
          <h3 className="text-h3" data-field="heading">{section.heading || (previewMode ? "Add a heading" : "")}</h3>
          <p className="mt-3 text-muted-foreground" data-field="body">{section.body || (previewMode ? "Click to add content" : "")}</p>
        </article>
      </div>
    );
  }
  if (section.type === "features") {
    return (
      <section className="container-page py-10">
        <h2 className="text-h2" data-field="heading">{section.heading}</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {(section.items ?? []).map((item, index) => (
            <li key={`${item.title}-${index}`} className="border-t border-stone pt-4">
              <h3 className="text-h3" data-field={`items.${index}.title`}>{item.title}</h3>
              <p className="mt-2 text-muted-foreground" data-field={`items.${index}.body`}>{item.body || (previewMode ? "Click to add content" : "")}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (section.type === "faq") {
    const items = section.items ?? [];
    return (
      <section className="container-page py-10">
        <h2 className="text-h2" data-field="heading">{section.heading || (previewMode && items.length === 0 ? "Create your first FAQ" : section.heading)}</h2>
        {items.length === 0 ? <Empty>Create your first FAQ</Empty> : null}
        <dl className="mt-6">
          {items.map((item, index) => (
            <div key={`${item.q}-${index}`} className="border-t border-stone py-4">
              <dt className="font-semibold" data-field={`items.${index}.q`}>{item.q || (previewMode ? "Add a question" : "")}</dt>
              <dd className="mt-2 text-muted-foreground" data-field={`items.${index}.a`}>{item.a || (previewMode ? "Click to add content" : "")}</dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }
  if (section.type === "testimonial") {
    return (
      <blockquote className="container-page border-l-4 border-green py-8 pl-5">
        <p className="font-serif text-2xl" data-field="quote">{section.quote || (previewMode ? "Click to add content" : "")}</p>
        <footer className="mt-4 text-sm">
          <span data-field="name">{section.name}</span>
          {section.role ? <span className="text-muted-foreground" data-field="role">, {section.role}</span> : <span data-field="role" />}
        </footer>
      </blockquote>
    );
  }
  if (section.type === "form") {
    const fields = section.fields?.length
      ? section.fields
      : [
          { id: "name", label: section.nameLabel || "Name", kind: "text", required: true },
          { id: "email", label: section.emailLabel || "Email", kind: "email", required: true },
          { id: "message", label: section.messageLabel || "Message", kind: "textarea", required: false },
        ];
    return (
      <form className="container-page grid max-w-xl gap-4 py-8" data-section-id={section.id}>
        {fields.map((field, index) => (
          <label key={field.id} className="grid gap-1 text-sm">
            <span data-field={`fields.${index}.label`}>{field.label}</span>
            {field.kind === "textarea" ? <textarea className="border border-stone px-3 py-2" name={field.id} required={field.required} /> : <input className="border border-stone px-3 py-2" name={field.id} type={field.kind} required={field.required} />}
          </label>
        ))}
        <button className="min-h-11 bg-plum px-4 font-semibold text-white" type="button" data-field="buttonLabel">{section.buttonLabel}</button>
        <p className="text-sm text-muted-foreground" data-field="thankYou">{section.thankYou || "This form does not send email until mail is connected. Your note is kept for review."}</p>
      </form>
    );
  }
  if (section.type === "newsletter") {
    return (
      <form className="container-page grid max-w-xl gap-4 py-8" data-section-id={section.id}>
        <h2 className="text-h2" data-field="heading">{section.heading}</h2>
        <label className="grid gap-1 text-sm">Email<input className="border border-stone px-3 py-2" type="email" name="email" /></label>
        <button className="min-h-11 bg-plum px-4 font-semibold text-white" type="button" data-field="buttonLabel">{section.buttonLabel}</button>
        <p className="text-sm text-muted-foreground">This signup does not send email until mail is connected. Addresses are kept for review.</p>
      </form>
    );
  }
  if (section.type === "map") {
    const query = encodeURIComponent(section.address || "");
    return (
      <div className="container-page py-8" data-section-id={section.id}>
        <p className="mb-3" data-field="address">{section.address || (previewMode ? "Add an address" : "")}</p>
        {section.address ? <iframe title="Map" className="h-72 w-full border border-stone" src={`https://maps.google.com/maps?q=${query}&output=embed`} /> : null}
      </div>
    );
  }
  if (section.type === "search") {
    return (
      <form className="container-page py-8" action="/search" data-section-id={section.id}>
        <label className="grid gap-2 text-sm">
          <span data-field="label">{section.label || "Search this site"}</span>
          <input className="border border-stone px-3 py-2" name="q" placeholder="Search pages and Insights" />
        </label>
      </form>
    );
  }
  if (section.type === "social") {
    return (
      <ul className="container-page flex flex-wrap gap-4 py-6" data-section-id={section.id}>
        {(section.links ?? []).map((link, index) => (
          <li key={`${link.href}-${index}`}><a href={link.href} data-field={`links.${index}.label`}>{link.label}</a></li>
        ))}
      </ul>
    );
  }
  if (section.type === "line") {
    return <hr className="container-page my-8 border-stone" data-section-id={section.id} />;
  }
  if (section.type === "audio") {
    return (
      <div className="container-page py-6" data-section-id={section.id}>
        <p data-field="label">{section.label}</p>
        {section.src ? <audio controls src={section.src} className="mt-2 w-full" /> : null}
      </div>
    );
  }
  if (section.type === "insights-summary") {
    return (
      <div data-section-id={section.id}>
        <h2 className="text-h2" data-field="heading">{section.heading}</h2>
      </div>
    );
  }
  if (section.type === "freeform") {
    return (
      <section className="container-page py-8">
        <FreeformZone id={section.id} name={section.name || "Freeform zone"} items={section.items ?? []} />
      </section>
    );
  }
  if (section.type === "embed") {
    return (
      <div className="container-page py-6">
        <iframe className="h-80 w-full border border-stone" src={section.url} title={section.title || "Embed"} sandbox="allow-scripts allow-popups" />
      </div>
    );
  }
  return null;
}
