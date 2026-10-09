import Link from "next/link";
import { readSite } from "@/lib/editor-site";

export function SiteFooter() {
  const { chrome } = readSite();
  const footer = chrome?.footer;
  const profile = chrome?.profile;
  return (
    <footer className="border-t border-stone bg-[#efebe4]" data-chrome="footer">
      <div className="container-page grid gap-10 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="font-serif text-2xl" data-chrome-field="siteName">{chrome?.header.siteName || "Quantum Age"}</p>
          <p className="mt-4 max-w-sm text-muted-foreground" data-field="note" data-chrome-field="note">{footer?.note}</p>
          {(footer?.images ?? []).map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={image.src} src={image.src} alt={image.alt} className="mt-4 h-16 w-auto" />
          ))}
        </div>
        <div className="md:col-span-4">
          <h2 className="eyebrow mb-4 text-muted-foreground">Pages</h2>
          <ul>
            {(footer?.links ?? []).map((link, index) => (
              <li key={`${link.href}-${index}`}>
                <Link href={link.href} data-footer-link={index} data-field="label" className="inline-flex min-h-10 items-center hover:text-plum hover:underline">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-4">
          <h2 className="eyebrow mb-4 text-muted-foreground">Contact</h2>
          <ul>
            {(footer?.contact ?? [profile?.phone, profile?.email, profile?.address].filter(Boolean) as string[]).map((line, index) => (
              <li key={`${line}-${index}`} className="py-1" data-footer-contact={index} data-field="contact">{line}</li>
            ))}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-4">
            {(footer?.social ?? []).map((link) => (
              <li key={link.href}><a href={link.href} className="underline">{link.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-stone">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-muted-foreground md:flex-row md:justify-between">
          <p data-field="copyright" data-chrome-field="copyright">{footer?.copyright}</p>
          <p data-field="cookie" data-chrome-field="cookie">{chrome?.cookieText}</p>
        </div>
      </div>
    </footer>
  );
}
