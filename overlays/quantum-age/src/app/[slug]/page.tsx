import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { SectionView } from "@/components/site/section-view";
import { customPages, previewMode, readEditorPage } from "@/lib/editor-site";

// Unlisted slugs must render completely before the response starts, or a missing
// page goes out as a 200 fallback shell before notFound() can set the 404.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  const slugs = customPages().map((page) => ({ slug: page.route.replace(/^\//, "") }));
  // Cache Components requires this function to return at least one result, even before any custom page exists.
  return slugs.length > 0 ? slugs : [{ slug: "new-page" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = readEditorPage(`/${slug}`);
  if (!page) return { title: "Page" };
  return { title: page.seoTitle || page.title, description: page.metaDescription || undefined };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  if (process.env.EDITOR_PREVIEW === "1") await connection();
  const { slug } = await params;
  const page = readEditorPage(`/${slug}`);
  if (!page || page.locked) notFound();
  if (page.archived && !previewMode) notFound();
  return (
    <article>
      {page.archived && previewMode ? <p className="container-page py-3 text-sm">This page is archived. It stays off the public site until you restore it.</p> : null}
      {page.sections.length === 0 && previewMode ? <div data-empty-page="true" className="min-h-40" /> : null}
      {page.sections.map((section) => (
        <SectionView key={section.id} section={section} />
      ))}
    </article>
  );
}
