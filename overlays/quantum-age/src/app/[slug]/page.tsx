import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { PageCanvas } from "@/components/site/flow-section";
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
  return <PageCanvas page={page} />;
}
