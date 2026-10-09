# Copy review

Humanizer review (`.agents/skills/humanizer/SKILL.md`) of the customer-facing copy on the Quantum Age site. Copy was changed only where a pattern clearly applied. Facts, names, contact details, service descriptions, SEO intent, and the approved calls to action stay as they were. The 115 Insights articles are published content, so they are reported here and not rewritten.

## Sources

- **Editable pages:** the saved editor draft (`workspace_drafts.draft_data`), which builds `src/content/editor/site.json` on the site, plus the matching defaults in `src/lib/flow-seed.ts` and `overlays/quantum-age/src/content/editor/site.json`. The same change went into all of them, so a reset or a new workspace gets the same copy.
- **Site content files:** `company.ts`, `people.ts`, `references.ts`, and `site.ts` in the site repository. Each public route in the production build was checked for their strings. Only the strings that also live in the editor draft still render. The rest (`company.partnership`, `teamIntro.collaborative`, and similar) no longer appear on any public page, so they were left alone.
- **Skipped:** `legal.ts`, page metadata, slugs, schema keys, person names, testimonials (they are quotations), and the prototype notes page (questions for the client, not marketing copy).

## Changes

| Where | Before | After | Pattern |
| --- | --- | --- | --- |
| Home, "Who we are" heading | An agile, responsive ally — an extension of your team | An agile, responsive ally that works as an extension of your team | §8 dash as connector |
| Home, "Who we are" body | Decades of health/senior care insight and marketing expertise make Quantum Age an agile and responsive ally – an extension of your team, assuring rightsized support for faster results. | Decades of health and senior care insight, plus marketing expertise, mean you get support sized to what you need, so results come faster. | §24 repeats the heading next to it, §8 dash |
| Home and Solutions, Build Awareness | Go from risky and unknown to renown and famous. | Go from risky and unknown to renowned. | Typo ("renown" is a noun), and "renowned and famous" says the same thing twice |
| Home and Solutions, Be a Thought Leader | Become a respected resource and earn trust—and/or business—for life. | Become a respected resource and earn trust (and business) for life. | §8 dashes. The aside is kept in parentheses. |
| About, "Who we are" | We bring deep expertise in healthcare and aging services—understanding the channels, challenges, and changes that make this sector unique. | We bring deep expertise in healthcare and aging services, including the channels, challenges, and changes that make this sector unique. | §8 dash, §15 -ing rider |
| Contact, lead | Helping you thrive in the longevity economy like never before. Ready to accelerate your growth? We're here to help. | We help organizations thrive in the longevity economy. Ready to accelerate your growth? We’re here to help. | §11 missing subject, §16 sales filler ("like never before") |
| Solutions, lead | Six solution areas for healthcare and senior care organizations. Flexible solutions that meet you where you are, from launching something new to getting more from what you already have. | Six solution areas for healthcare and senior care organizations. Each one starts from where you are, whether you’re launching something new or getting more from what you already have. | §2 fragment that repeats "solutions", stock phrase |
| Home, closing call to action | Let's collaborate to elevate your strategy and achieve measurable results. | Let’s collaborate to elevate your strategy and achieve measurable results. | Typography only (see below) |
| Insights, closing call to action | Ready to accelerate your growth in the longevity economy? We're here to help. | Ready to accelerate your growth in the longevity economy? We’re here to help. | Typography only |
| Contact, heading | Let's collaborate | Let’s collaborate | Typography only |

**Apostrophes.** Humanizer §21 treats curly quotes as a weak tell when the target format uses straight ones. This site already uses curly quotes and apostrophes throughout its titles and articles ("From “More” to “Smarter”", "CC Andrews’"), so the four straight apostrophes were the odd ones out. Hallmark lists straight quotes as a minor typographic tell. The fix follows the site's own convention.

## Flagged on the pages and left alone

- **"Elevate strategy. Accelerate growth."** (home hero) and **"Build. Grow. Achieve. Maximize. Influence."** (About heading) are §2 rows of fragments. Both are brand taglines the client approved, so they stay.
- **"Helping you achieve your goals."** (Approach heading) has no subject (§11) and ends a heading with a period. Suggested: "We help you reach your goals." Left for the client because it is a page title.
- **About lead and About "Who we are"** repeat the same sentence ("…mobilize(s) leading experts to help healthcare organizations focused on growth achieve their goals."). Suggested: keep it once. Left because removing it changes the page structure.
- **"Market intelligence, strategic playbooks, and proven tactics for the longevity economy."** (Insights lead) is a §6 triad, but it matches the page's meta description. It stays to keep the SEO wording consistent.
- **"Trusted by leading healthcare organizations"** (References heading) leans on §17 borrowed authority. It stays until the client confirms which organizations may be named (an open question on the prototype notes page).
- **"Target the right buyers, right messages, right campaigns, at the right time."** repeats "right" on purpose for rhythm, which the skill allows.
- **"The only marketing firm in senior care steeped in both consumer and business-to-business."** is a factual claim the prototype notes already ask the client to confirm. Not changed.

## Insights articles (report only)

The 115 articles were scanned for the strongest structural tells: §1 not-X-but-Y contrasts, §8 dashes as connectors, §12 overused AI words, §13 and §18 inflation, and §19 bold labels. The skill says text written before November 30, 2022 is not AI-written, so the 101 older articles were counted but are not treated as AI-written.

| | Articles | Dashes | §1 contrasts | §12 words | §13/§18 phrases | Bold labels |
| --- | --- | --- | --- | --- | --- | --- |
| Before Dec 2022 | 101 | 222 | 9 | 41 | 5 | 101 |
| Dec 2022 onward | 14 | 118 | 6 | 10 | 0 | 10 |
| All articles | 115 | 340 | 15 | 51 | 5 | 111 |

Per article, the 14 recent articles average about eight dashes each, against about two for the older ones.

The most frequent §12 words were "landscape" (8), "enhance" (7), "showcase" (6), and "crucial" (5).

Eleven of the 14 recent articles score high: several tells per thousand words, usually a dash in most paragraphs plus at least one §1 contrast. These are the passages a writer should look at first:

| Published | Article | Example passage |
| --- | --- | --- |
| 2025-05-14 | cut-through-the-noise | "clarity isn’t just a nice-to-have—it’s your biggest asset." |
| 2026-01-23 | from-more-to-smarter-why-efficient-growth-is-the-new-mandate-for-b2b-marketing-in-2026 | "Growth at all costs wasn’t just accepted—it was rewarded." |
| 2025-09-18 | reputation-at-risk-why-skilled-nursing-needs-a-new-playbook-for-online-perception | "being judged not only on outcomes, but on how visible, current, and compelling their story is" |
| 2025-07-24 | 10-low-lift-marketing-moves-that-deliver-big-in-senior-care | "Smart, scrappy marketing is having a moment — and not just in trendy tech circles." |
| 2025-08-04 | how-gpt4-can-be-used-for-senior-care-and-niche-content-marketing | "tools like GPT-4 aren’t magic wands." (and a dash in most paragraphs) |
| 2025-02-07 | shifting-to-a-quality-mindset-why-abm-is-a-game-changer | "has become more than just a buzzword—it’s a game-changing strategy that’s here to stay." |
| 2025-07-24 | why-reputation-management-is-now-mission-critical-for-senior-living-operators | "But it’s not just a feel-good metric—it’s a signal." |
| 2025-09-19 | what-the-latest-ai-marketing-trends-mean-for-senior-care-b2b-marketers | "How to use AI with purpose—not just because it’s trending" |
| 2025-03-06 | 2025-aging-services-trends | "this isn’t a time for business as usual." ("navigating the", "robust", "landscape") |
| 2025-07-24 | the-power-of-niche-marketing-why-going-narrow-can-help-you-go-big | "The more specific your audience, the more relevant your message—and relevance is what drives results." |
| 2026-09-29 | reputation-is-a-strategy-building-trust-before-you-need-it | "Every family call returned—or not returned." |

Recommendation for the client: the recent articles share one habit, a dash joining two clauses, often around a "not just X" contrast. A writer can fix both in one pass per article. The older archive needs no Humanizer pass. The open question there is whether to keep, label, or retire it (already on the prototype notes page).
