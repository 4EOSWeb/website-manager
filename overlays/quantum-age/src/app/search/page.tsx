import Link from "next/link";
import { Suspense } from "react";
import { getArticleSummaries } from "@/lib/insights";
import { readSite } from "@/lib/editor-site";
import { readStructuredPosts } from "@/lib/structured-posts";

type Params = { searchParams: Promise<{ q?: string }> };

export default function SearchPage({ searchParams }: Params) {
  return (
    <article className="container-page py-16">
      <h1 className="text-h1">Search</h1>
      <Suspense fallback={<SearchForm q="" />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </article>
  );
}

function SearchForm({ q }: { q: string }) {
  return (
    <form className="mt-6 flex gap-2" action="/search">
      <input className="min-h-11 flex-1 border border-stone px-3" name="q" defaultValue={q} aria-label="Search pages and Insights" />
      <button className="min-h-11 bg-plum px-4 font-semibold text-white" type="submit">Search</button>
    </form>
  );
}

async function SearchResults({ searchParams }: Params) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const pages = readSite().pages.filter((page) => !page.locked && !page.archived);
  const posts = [
    ...readStructuredPosts().map((post) => ({ href: `/insights/${post.slug}`, title: post.title, text: post.excerpt })),
    ...getArticleSummaries().map((article) => ({ href: `/insights/${article.slug}`, title: article.title, text: article.summary })),
  ];
  const matches = query
    ? [
        ...pages.filter((page) => `${page.title} ${page.navLabel ?? ""} ${page.route}`.toLowerCase().includes(query)).map((page) => ({ href: page.route, title: page.title, text: page.metaDescription })),
        ...posts.filter((post) => `${post.title} ${post.text}`.toLowerCase().includes(query)),
      ]
    : [];
  return (
    <>
      <SearchForm q={q ?? ""} />
      <ul className="mt-8 grid gap-4">
        {matches.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-h3 hover:text-plum">{item.title}</Link>
            {item.text ? <p className="text-muted-foreground">{item.text}</p> : null}
          </li>
        ))}
      </ul>
      {query && matches.length === 0 ? <p className="mt-8">Nothing on this site matches that search.</p> : null}
    </>
  );
}
