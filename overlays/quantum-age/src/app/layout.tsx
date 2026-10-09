import type { Metadata, Viewport } from "next";
import { Figtree, Source_Serif_4 } from "next/font/google";
import { PrototypeBanner, SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { EditorPreviewScript } from "@/components/site/editor-preview-script";
import { EditorPreviewProvider } from "@/components/site/editor-preview-flag";
import { EditorRegions } from "@/components/site/editor-regions";
import { site } from "@/content/site";
import { readSite } from "@/lib/editor-site";
import "lenis/dist/lenis.css";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.prototypeUrl),
  title: {
    default: `${site.name} | ${site.descriptor}`,
    template: `%s | ${site.name}`,
  },
  description: `${site.descriptor}. ${site.positioning}`,
  applicationName: site.name,
  authors: [{ name: site.legalName }],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} | ${site.descriptor}`,
    description: site.positioning,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.descriptor}`,
    description: site.positioning,
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = readSite().chrome?.theme;
  const spacing = theme?.spacing === "compact" ? "is-compact" : theme?.spacing === "roomy" ? "is-roomy" : "";
  return (
    <html lang="en" className={`${figtree.variable} ${sourceSerif.variable} ${theme?.font === "sans" ? "font-sans" : ""}`}>
      <body className={`flex min-h-dvh flex-col ${spacing}`}>
        {theme ? (
          <style>{`:root{--ink:${theme.ink};--plum:${theme.plum};--paper:${theme.paper};--green:${theme.green};--background:${theme.paper};}
            ${theme.font === "sans" ? "h1,h2,h3,.text-display,.text-h1,.text-h2,.text-h3{font-family:var(--font-figtree),sans-serif;}" : ""}
            ${theme.button === "outline" ? "a.bg-plum,.bg-plum{background:transparent !important;color:var(--plum) !important;box-shadow:inset 0 0 0 1.5px var(--plum);}" : ""}
            ${theme.spacing === "compact" ? ".py-16{padding-top:2.5rem;padding-bottom:2.5rem;}" : ""}
            ${theme.spacing === "roomy" ? ".py-16{padding-top:6.5rem;padding-bottom:6.5rem;}" : ""}
          `}</style>
        ) : null}
        {process.env.EDITOR_PREVIEW === "1" ? null : <style>{`[data-hidden="true"]{display:none !important}`}</style>}
        <EditorPreviewScript />
        <EditorPreviewProvider enabled={process.env.EDITOR_PREVIEW === "1"}>
        <SmoothScroll>
          <a
            href="#main"
            className="sr-only z-50 bg-plum px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to main content
          </a>
          <PrototypeBanner />
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            <EditorRegions>{children}</EditorRegions>
          </main>
          <SiteFooter />
        </SmoothScroll>
        </EditorPreviewProvider>
      </body>
    </html>
  );
}
