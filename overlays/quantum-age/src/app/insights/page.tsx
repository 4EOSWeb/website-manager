import type { Metadata } from "next";
import { InsightsBrowser } from "@/components/site/insights-browser";
import { PageCanvas } from "@/components/site/flow-section";
import { getArchiveRange, getArticleSummaries, getTagCounts } from "@/lib/insights";
import { readEditorPage } from "@/lib/editor-site";
import { readStructuredPosts } from "@/lib/structured-posts";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Market intelligence, strategic playbooks, and proven tactics for the longevity economy, from the Quantum Age team.",
};

export default async function InsightsPage() {
  if (process.env.EDITOR_PREVIEW === "1") await connection();
  const editorPage = readEditorPage("/insights");
  const structured = readStructuredPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    date: new Date().toISOString().slice(0, 10),
    author: post.authorDisplayName,
    readMinutes: null,
    tags: ["Draft"],
    summary: post.excerpt,
    hero: post.featuredImage ? { src: post.featuredImage.src, width: 1200, height: 675, alt: post.featuredImage.alt } : null,
    sourceUrl: "",
    featured: false,
  }));
  const all = [...structured, ...getArticleSummaries()].sort((a, b) => b.date.localeCompare(a.date));
  const tags = getTagCounts();
  const range = getArchiveRange();

  return (
    <>
      {editorPage ? <PageCanvas page={{ ...editorPage, sections: editorPage.sections.filter((section) => section.layout !== "cta") }} /> : null}
      <section className="pb-[var(--section)]" aria-labelledby="archive-heading">
        <div className="container-page">
          <h2 id="archive-heading" className="text-h2 mb-8" data-field="archive">
            The archive
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">{range.count} articles · {range.first}–{range.last} · {tags.length} topics</p>
          <InsightsBrowser articles={all} tags={tags} />
        </div>
      </section>
      {editorPage ? <PageCanvas page={{ ...editorPage, sections: editorPage.sections.filter((section) => section.layout === "cta") }} /> : null}
    </>
  );
}
