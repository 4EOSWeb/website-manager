import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/site/blocks";
import { ArticleFeature } from "@/components/site/article-item";
import { InsightsBrowser } from "@/components/site/insights-browser";
import { getArchiveRange, getArticleSummaries, getFeaturedArticles, getTagCounts } from "@/lib/insights";
import { readStructuredPosts } from "@/lib/structured-posts";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Market intelligence, strategic playbooks, and proven tactics for the longevity economy, from the Quantum Age team.",
};

export default async function InsightsPage() {
  if (process.env.EDITOR_PREVIEW === "1") await connection();
  const featured = getFeaturedArticles();
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
      <PageHero
        eyebrow="Insights"
        title="Insights that drive growth"
        lead={<p>Market intelligence, strategic playbooks, and proven tactics for the longevity economy.</p>}
        aside={
          <dl className="grid grid-cols-3 border-t border-stone pt-5 lg:mt-3 lg:grid-cols-1 lg:gap-5">
            {[
              { label: "Articles", value: String(range.count) },
              { label: "Published", value: `${range.first}–${range.last}` },
              { label: "Topics", value: String(tags.length) },
            ].map((f) => (
              <div key={f.label}>
                <dt className="text-sm font-semibold text-muted-foreground">{f.label}</dt>
                <dd className="mt-1 font-serif text-[1.75rem] leading-tight text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        }
      />

      <section className="section-sm" aria-labelledby="featured-heading">
        <div className="container-page">
          <h2 id="featured-heading" className="eyebrow font-sans text-muted-foreground">
            Featured
          </h2>
          <div className="mt-6 grid gap-10 md:grid-cols-3">
            {featured.map((a, i) => (
              <ArticleFeature key={a.slug} article={a} priority={i === 0} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-[var(--section)]" aria-labelledby="archive-heading">
        <div className="container-page">
          <h2 id="archive-heading" className="text-h2 mb-8">
            The archive
          </h2>
          <InsightsBrowser articles={all} tags={tags} />
        </div>
      </section>

      <CtaBand
        title="Want to talk through an idea from the archive?"
        body="Ready to accelerate your growth in the longevity economy? We're here to help."
      />
    </>
  );
}
