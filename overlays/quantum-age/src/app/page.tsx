import { Fragment } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rings } from "@/components/brand/rings";
import { CtaBand, SectionHeading, TextLink } from "@/components/site/blocks";
import { Parallax } from "@/components/motion/scroll-linked";
import { FormulaStory } from "@/components/site/formula-story";
import { TestimonialQuote } from "@/components/site/testimonial";
import { Portrait } from "@/components/site/portrait";
import { ArticleFeature } from "@/components/site/article-item";
import { HeroContentImage } from "@/components/site/hero-content-image";
import { site } from "@/content/site";
import home from "@/content/pages/home.json";
import { about, benefits, formula } from "@/content/company";
import { solutions } from "@/content/solutions";
import { people, teamIntro } from "@/content/people";
import { testimonials } from "@/content/references";
import { getArchiveRange, getFeaturedArticles } from "@/lib/insights";

export default function HomePage() {
  const featured = getFeaturedArticles();
  const archive = getArchiveRange();
  const [lead, ...more] = testimonials;
  const taglineLines = home.tagline.split(/(?<=\.)\s+/);
  const stagger = (i: number, step?: string) => ({ "--i": i, ...(step && { "--step": step }) }) as React.CSSProperties;

  return (
    <>
      <section aria-labelledby="home-title" className="relative overflow-hidden border-b border-stone">
        <div className="container-page grid items-center gap-8 pt-12 pb-14 md:pt-20 md:pb-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="intro eyebrow mb-6 text-plum">{site.descriptor}</p>
            <h1 id="home-title" className="text-display max-w-[13ch]" data-editable="tagline">
              {taglineLines.map((line, i) => (
                <Fragment key={line}>
                  {i > 0 && " "}
                  <span className="intro block" style={{ "--d": i + 1 } as React.CSSProperties}>
                    {line}
                  </span>
                </Fragment>
              ))}
            </h1>
            <p className="intro text-lead mt-7 max-w-[44ch] text-ink/80" style={{ "--d": 3 } as React.CSSProperties} data-editable="positioning">
              {home.positioning}
            </p>
            <div className="intro mt-9 flex flex-wrap gap-3" style={{ "--d": 4 } as React.CSSProperties}>
              <Button asChild size="lg">
                <Link href={home.primaryButton.href} data-editable="primaryButton">
                  {home.primaryButton.label}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/solutions">Explore solutions</Link>
              </Button>
            </div>
            <HeroContentImage image={home.heroImage} slot="with-copy" />
          </div>
          <div className="relative mx-auto hidden w-full max-w-[460px] sm:block lg:col-span-5">
            <Parallax speed={0.14} rotate={1.2}>
              <Rings intro className="w-full" />
            </Parallax>
            <HeroContentImage image={home.heroImage} slot="beside-mark" />
          </div>
        </div>
        <div className="relative border-t border-stone bg-[#efebe4]">
          <div className="container-page flex flex-col gap-3 py-5 md:flex-row md:items-baseline md:gap-8">
            <h2 className="eyebrow shrink-0 font-sans text-muted-foreground">Who we work with</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[0.9375rem] font-medium text-ink">
              {about.focus.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="who-heading">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading id="who-heading" eyebrow="Who we are" title="An agile, responsive ally — an extension of your team" />
          </div>
          <div className="lg:col-span-7">
            <p className="text-lead text-ink">{about.whoWeAre[0]}</p>
            <p className="mt-5 max-w-[62ch] text-muted-foreground">{site.credibility}</p>
            <TextLink href="/about" className="mt-4">
              More about Quantum Age
            </TextLink>
          </div>
          <ul className="grid gap-8 border-t border-stone pt-10 sm:grid-cols-3 lg:col-span-12">
            {benefits.map((b, i) => (
              <li key={b.title} className="reveal" style={stagger(i)}>
                <span className="font-serif text-lg text-green-800" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="text-h3 mt-2">{b.title}</h3>
                <p className="mt-2 text-muted-foreground">{b.home}.</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-[#efebe4]" aria-labelledby="solutions-heading">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <SectionHeading
              id="solutions-heading"
              eyebrow="What we do"
              title="Six solution areas, one collaborative team"
              lead="Comprehensive marketing solutions for healthcare organizations, combined around what you need now."
              className="lg:col-span-8"
            />
            <div className="lg:col-span-4 lg:text-right">
              <TextLink href="/solutions">All solutions and capabilities</TextLink>
            </div>
          </div>
          <ol className="mt-12 grid md:grid-cols-2 md:gap-x-12">
            {solutions.map((s, i) => (
              <li key={s.id} className="reveal border-t border-ink/15" style={stagger(i % 2)}>
                <Link
                  href={`/solutions#${s.id}`}
                  className="group relative grid grid-cols-[2.5rem_1fr_auto] items-start gap-4 py-6 before:absolute before:inset-x-0 before:-top-px before:h-0.5 before:origin-left before:scale-x-0 before:bg-plum before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:before:scale-x-100 focus-visible:before:scale-x-100 sm:px-2"
                >
                  <span
                    className="pt-1 font-serif text-lg text-plum transition-colors duration-300 group-hover:text-green-800"
                    aria-hidden="true"
                  >
                    0{i + 1}
                  </span>
                  <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                    <span className="text-h3 block transition-colors duration-300 group-hover:text-plum">{s.name}</span>
                    <span className="mt-1 block text-muted-foreground">{s.summary}</span>
                  </span>
                  <ArrowRightIcon
                    className="mt-2 size-5 text-plum transition-transform duration-300 group-hover:translate-x-1.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FormulaStory eyebrow={formula.title} title={formula.subtitle} parts={formula.parts} result={formula.result} />

      <section className="section" aria-labelledby="people-heading">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <SectionHeading
              id="people-heading"
              eyebrow="The team"
              title={teamIntro.lead}
              lead={about.experience}
              className="lg:col-span-8"
            />
            <div className="lg:col-span-4 lg:text-right">
              <TextLink href="/team">Meet all nine</TextLink>
            </div>
          </div>
          <ul className="mt-12 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-5 lg:grid-cols-9">
            {people.map((p, i) => (
              <li key={p.slug} className="reveal text-center" style={stagger(i, "6%")}>
                <Link href={`/team#${p.slug}`} className="group block">
                  <Portrait src={p.image} name={p.name} decorative sizes="(min-width: 1024px) 10vw, 28vw" />
                  <span className="mt-3 block text-sm font-semibold text-ink group-hover:text-plum group-hover:underline">
                    {p.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-plum-50" aria-labelledby="clients-heading">
        <div className="container-page">
          <SectionHeading id="clients-heading" eyebrow="References" title="What our clients say" />
          <div className="mt-12 grid gap-12 lg:grid-cols-12">
            <TestimonialQuote testimonial={lead} size="lg" className="reveal lg:col-span-7" />
            <div className="grid gap-12 lg:col-span-5">
              {more.map((t, i) => (
                <TestimonialQuote key={t.name} testimonial={t} className="reveal" style={stagger(i + 1)} />
              ))}
            </div>
          </div>
          <TextLink href="/references" className="mt-10">
            Who we work with
          </TextLink>
        </div>
      </section>

      <section className="section" aria-labelledby="insights-heading">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <SectionHeading
              id="insights-heading"
              eyebrow="Insights"
              title="Writing on senior care, aging services and B2B marketing"
              lead={`${archive.count} articles published since ${archive.first}.`}
              className="lg:col-span-8"
            />
            <div className="lg:col-span-4 lg:text-right">
              <TextLink href="/insights">Browse all insights</TextLink>
            </div>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {featured.map((a, i) => (
              <div key={a.slug} className="reveal" style={stagger(i)}>
                <ArticleFeature article={a} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Ready to accelerate your growth?"
        body="Let's collaborate to elevate your strategy and achieve measurable results."
      />
    </>
  );
}
