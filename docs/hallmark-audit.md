# Hallmark audit

Audit of every editor surface and every public route, using the Hallmark anti-pattern list (`.agents/skills/hallmark/references/anti-patterns.md`). The public site keeps its brand: the rings mark, the plum, green, and paper colors, Source Serif with Figtree, and the existing page compositions. Public pages were changed only for confirmed defects. `globals.css` was only appended to.

## What was checked

- **Editor:** 14 surfaces at 1440 × 900, plus the default view at 1280. The surfaces were the default canvas, the Add, Pages, Layers, Styles, and Media panels, a selected section (Layout, Design, and Advanced tabs), the overflow menu, a selected text block, text editing with the format bar, a selected button, the Add page dialog, the review dialog, the shortcuts dialog, the hover state of an Add section gap, and the insert dialog.
- **Public site:** a production build (`next build` without `EDITOR_PREVIEW`), served with `next start`. Each of 15 routes was loaded at 1280, 768, and 390 pixels wide. Each load checked the HTTP status, horizontal overflow, the number of h1 elements, skipped heading levels, images without `alt`, and console or page errors. Screenshots were taken at 1280 and 390.

## Findings

### Fixed

```
[critical] Broken production build — overlays/quantum-age/src/components/site/editor-regions.tsx:28, site-header.tsx:36, app/insights/page.tsx:21, app/search/page.tsx:13
  `next build` failed. The root layout read request headers outside Suspense, the insights page used `new Date()` while prerendering, and search read searchParams outside Suspense.
  → Skip the header read when no page needs it, wrap the rest in Suspense, date drafts by file time, and stream the search results.

[major] Reading progress bar crosses the header — overlays/quantum-age/src/components/motion/scroll-linked.tsx:70-75
  At the top of an article, the 3px green bar sat at 4.5rem, through the middle of the header (the preview banner pushes the header down). On short articles it also loaded fully filled.
  → Pin the bar to the header's actual bottom edge, and hide it when the article fits on screen.

[major] Hero lost its button hierarchy — src/lib/flow-seed.ts:72
  When the home page moved to flow sections, "Explore solutions" lost its outline style, so the hero showed two equal plum buttons.
  → Restore `variant: "outline"` in the seed and in the saved drafts. This matches the original home composition.

[major] Tooltips with the same delay on hover and focus — src/components/editor/editor.css:132, overlays/quantum-age/src/components/site/canvas-script.ts:73
  Tooltips appeared instantly on hover, flickered over the toolbar, and stayed visible after a click.
  → Wait 700ms on hover and show immediately on keyboard focus.

[major] Tooltip covers its own open menu — src/components/editor/editor.css:136
  The "More" tooltip covered the menu it had just opened.
  → Hide the tooltip on any control with `aria-expanded="true"`.

[major] Spinners that flash — src/components/editor/chrome.tsx:28, editor.css (end of file)
  Every autosave flashed a spinner for about 100ms, and "Unsaved changes" also showed a spinning icon.
  → Reveal the spinner only after 300ms, and show a still dot for unsaved changes.

[major] Dialog ignores Escape when nothing inside can take focus — src/components/editor/ui.tsx:187, 215
  The shortcuts dialog has no input, so focus stayed on the page behind it and Escape didn't reach the dialog.
  → Fall back to the close button, then to the dialog itself (`tabIndex={-1}`).

[minor] Title Case status tag — src/components/editor/editor.css:80
  Earlier reviews showed "Saved Locally" in Title Case, unlike the sentence case used everywhere else.
  → Remove `text-transform: capitalize`.

[minor] Transparent images vanish in thumbnails — src/components/editor/editor.css:1411, 1498
  Black line art on a transparent PNG disappeared on the dark thumbnail background in the Media panel and the image picker.
  → Use a light checkerboard background behind thumbnails.

[minor] Repeated reviews look identical — src/components/editor/dialogs.tsx:283
  Two reviews with the same summary looked like a duplicate entry.
  → Show the time each review was sent, using tabular numbers.
```

### Reported, not changed (brand composition)

```
[major] Eyebrow on every section — .workspaces/web_quantum_age/src/content/editor/site.json (blocks of kind "eyebrow")
  Six of the nine home sections and both About sections start with a small uppercase eyebrow.
  → Client decision: keep the hero eyebrow and drop the rest. Each one can be hidden in the editor without touching code.

[minor] Same split layout repeated — home "Who we are" and similar sections
  Small tag on the left, heading on the right, used repeatedly. It is part of the brand's composition, so it was left as is.
  → If the client wants more variety, change one of these sections to a full-width statement.

[minor] Straight quotes — site.json:766, 1436, 1477, 1486
  "Let's" and "We're" use straight apostrophes in the marketing copy.
  → Fixed in the copy review (docs/copy-review.md).

[minor] Search field without a visible label — overlays/quantum-age/src/app/search/page.tsx:23
  The field has an `aria-label`, and the "Search" heading sits directly above it, but there is no `<label>`.
  → Acceptable for a one-field page. Add a visible label if the page grows.

[minor] z-index: 2147483000 — overlays/quantum-age/src/components/site/canvas-script.ts:61, 97, 98
  The canvas controls are injected into the client's page inside the editor frame, so they must sit above any site stacking context. Editor-only; never ships to the public site.
  → Accepted.
```

## Public route results (production build)

Every route below loaded with no horizontal overflow at 1280, 768, or 390. Each had exactly one h1, no skipped heading levels, no images without `alt`, and no console errors.

| Route | 1280 | 768 | 390 |
| --- | --- | --- | --- |
| `/` | pass | pass | pass |
| `/solutions` | pass | pass | pass |
| `/approach` | pass | pass | pass |
| `/about` | pass | pass | pass |
| `/team` | pass | pass | pass |
| `/references` | pass | pass | pass |
| `/insights` | pass | pass | pass |
| `/contact` | pass | pass | pass |
| `/privacy` | pass | pass | pass |
| `/terms` | pass | pass | pass |
| `/search?q=care` | pass | pass | pass |
| `/prototype-notes` | pass | pass | pass |
| `/insights/leadership-in-times-of-crisis` | pass after the progress bar fix | pass | pass |
| `/new-page` | 404, expected | 404 | 404 |
| `/does-not-exist` | 404 | 404 | 404 |

`/new-page` is the placeholder that Next.js requires `generateStaticParams` to return before any custom page exists. It returns 404 on purpose.

## Summary

Summary — 1 critical · 7 major · 7 minor (10 fixed, 5 reported)
Verdict — close, fix the minors. The critical finding (the broken build) and every major editor finding are fixed. What remains is brand composition that the client should decide on.
