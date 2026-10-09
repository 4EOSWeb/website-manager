# Architecture separation

This audit records Quantum Age knowledge in the editor. Milestone 1 does not change runtime code.

## Names

Search: `quantum`, `Quantum Age`, `quantum-age`, `web_quantum_age` in tracked text, excluding `.qa/`, `node_modules`, and `.next`.

### src/lib/flow-seed.ts

- Current file: `src/lib/flow-seed.ts`
- Current behavior: Seeds the site name “Quantum Age”, the copyright line, `askQA@quantum-age.com`, and marketing sentences that name Quantum Age.
- Why it is site-specific: The copy and the company name belong to one website.
- Generic replacement: A site seed supplied by that site’s adapter. The platform ships no brand name.
- Destination adapter file: `adapters/quantum-age/seed.ts`
- Migration risk: Existing drafts were seeded from this file. A new seed must not overwrite saved drafts.
- Test required: `tests/unit/qa-seed-location.test.ts` after the move. Until then, the editor still loads the current draft.

### overlays/quantum-age/4eos.editor.config.json

- Current file: `overlays/quantum-age/4eos.editor.config.json`
- Current behavior: Declares `websiteId` `web_quantum_age`, name `Quantum Age`, and repository `quantum-age`.
- Why it is site-specific: It is the manifest for one site.
- Generic replacement: Adapter metadata discovered by folder, not a hardcoded id in the platform.
- Destination adapter file: `adapters/quantum-age/metadata.ts`
- Migration risk: `Website.manifest` in Postgres was parsed from this file.
- Test required: `tests/unit/qa-adapter-metadata.test.ts`

### src/lib/content-schema.ts

- Current file: `src/lib/content-schema.ts`
- Current behavior: Default author display name and a default string are “Quantum Age”. A comment says a leftover image is not part of the Quantum Age design.
- Why it is site-specific: Schema defaults name one brand.
- Generic replacement: Defaults come from the adapter or are empty. The visual document schema has no brand name.
- Destination adapter file: `adapters/quantum-age/seed.ts` for the words, and `src/platform/document/` for the generic schema.
- Migration risk: Changing defaults must not rewrite stored drafts that already contain these strings.
- Test required: Version 3 drafts still parse. Later, migrated documents keep the author string.

### Other name hits

Each of these names the site. None of them are a platform concept.

- `overlays/quantum-age/4eos.editor.config.ts` — comment that the manifest is for the Quantum Age test site. Destination: `adapters/quantum-age/metadata.ts`. Risk: comment only. Test: adapter metadata test.
- `overlays/quantum-age/src/lib/structured-posts.ts` — fallback author “Quantum Age”. Destination: `adapters/quantum-age/articles.ts`. Risk: articles with no author would change if the fallback moves. Test: article render comparison.
- `overlays/quantum-age/src/app/insights/page.tsx` — meta description names the Quantum Age team. Destination: adapter article copy, not the hub. Risk: public meta text. Test: production page still returns the same description until an intentional copy change.
- `overlays/quantum-age/src/components/site/home-canvas.tsx` — link “More about Quantum Age”. Destination: seed or document content. Risk: visible home copy. Test: home preview text.
- `overlays/quantum-age/src/components/site/site-footer.tsx` — fallback site name “Quantum Age”. Destination: adapter chrome defaults. Risk: empty chrome would show a different fallback. Test: footer still shows the saved site name.
- `src/lib/workspace.ts` — overlay path `overlays/quantum-age` and clone URL `quantum-age.git`. Destination: workspace path on the website record. Risk: preview checkout. Test: Quantum Age preview still opens.
- `scripts/sync-overlay.ts` and `scripts/route-inventory.ts` — default workspace `web_quantum_age`. Destination: argument or website id, not a default brand. Risk: scripts used by local preview. Test: `overlay:sync` still copies the Quantum Age overlay when given that id.
- `scripts/verify-slice.ts` — assertions use `web_quantum_age` and `quantum-age`. Destination: a fixture id in the test. Risk: the verify script. Test: `npm run verify`.
- `prisma/seed.mjs` — inserts client and website rows for Quantum Age. Destination: seed data, not platform logic. Risk: re-seeding. Test: seed is not run as part of editor startup.
- `tests/e2e/helpers.ts`, `tests/e2e/auth.setup.ts`, `tests/e2e/global-setup.ts`, `tests/e2e/global-teardown.ts`, `tests/e2e/formatting.spec.ts`, `tests/e2e/failures.spec.ts` — the current end-to-end site id and a sentence used for formatting. Destination: stay as the Quantum Age suite; Harbor gets its own suite. Risk: none if these tests keep targeting Quantum Age. Test: the existing editor Playwright project.
- `tests/unit/editor-ops.test.ts` — allows `mailto:askQA@quantum-age.com`. Destination: the link test can use any allowed mailto. Risk: low. Test: unit link test.
- `tests/unit/canvas-script.test.ts`, `tests/unit/marks.test.ts`, `tests/unit/canvas.test.ts` — import the Quantum Age overlay. Destination: generic canvas runtime tests, with the overlay tested as one consumer. Risk: moving the canvas runtime. Test: those unit files.
- `tests/e2e/routes.json` and `docs/route-audit.md` — article slugs that contain the name. Destination: discovered routes, not platform constants. Risk: route crawl list. Test: route crawl.
- `docs/architecture.md`, `docs/copy-review.md`, `docs/hallmark-audit.md`, `docs/sprint-report.md`, `README.md`, and `docs/baseline/editor-behavior.md` — describe the current product. Destination: historical docs. Risk: none for runtime. Test: none.

Re-check command: `rg -l -i "quantum|web_quantum_age" --glob '!node_modules/**' --glob '!.next/**' --glob '!.qa/**'`.

## Routes

The platform must not keep a reserved-route constant. Reserved addresses are adapter data.

Two hub sets match each other. A third copy lives in the overlay.

### src/lib/editor-ops.ts

- Current file: `src/lib/editor-ops.ts`, line 361, `const RESERVED`
- Current behavior: Refuses address changes for `/`, `/about`, `/approach`, `/solutions`, `/team`, `/references`, `/insights`, `/contact`, `/privacy`, `/terms`, and `/prototype-notes`.
- Why it is site-specific: Those paths are this website’s pages, not a rule of every Next.js site.
- Generic replacement: `adapter.pages.reservedRoutes`, checked by generic page rules.
- Destination adapter file: `adapters/quantum-age/routes.ts` and `adapters/quantum-age/page-rules.ts`
- Migration risk: Custom pages that reused one of these paths would already be blocked. Moving the list must keep the same block for Quantum Age.
- Test required: `tests/unit/qa-adapter-reserved.test.ts`, plus a second adapter that does not reserve `/insights`.

### src/lib/content-schema.ts

- Current file: `src/lib/content-schema.ts`, lines 464–476, `BUILT_IN_ROUTES`
- Current behavior: The same eleven paths as `RESERVED`.
- Why it is site-specific: Same as above.
- Generic replacement: The adapter reserved list. The visual document schema has no built-in route set.
- Destination adapter file: `adapters/quantum-age/page-rules.ts`
- Migration risk: Validation that depends on this set must keep rejecting those addresses for Quantum Age until the adapter is wired.
- Test required: The same reserved-route test, comparing both constants to the adapter list before either constant is deleted.

### overlays/quantum-age/src/lib/editor-site.ts

- Current file: `overlays/quantum-age/src/lib/editor-site.ts`, lines 117–129, `BUILT_IN`
- Current behavior: The overlay repeats the same eleven paths.
- Why it is site-specific: The preview site knows its own pages.
- Generic replacement: The site adapter. The overlay may keep its own routes as site code. The hub must not import this set.
- Destination adapter file: `adapters/quantum-age/routes.ts`
- Migration risk: Public pages are rendered by these routes. Do not rename them.
- Test required: Preview still opens `/about` and `/insights`.

Content links to `/contact` and `/about` in `src/lib/flow-seed.ts`, `src/lib/page-documents.ts`, `src/lib/library.ts`, and the overlay components are page content, not the reserved set. They move with the seed and the site components. `overlays/quantum-age/4eos.editor.config.json` lines 14–22 list the same routes except `/` and `/prototype-notes`.

## Insights

The generic replacement is adapter article capabilities. The hub must not branch on the string `/insights`.

### src/components/editor-shell.tsx

- Current file: `src/components/editor-shell.tsx`, lines 113 and 539
- Current behavior: `activePost` matches `path === `/insights/${item.slug}``, and opening a post navigates to `/insights/${post.slug}`.
- Why it is site-specific: The article collection is hardcoded to one route prefix.
- Generic replacement: `adapter.articles.routePattern`.
- Destination adapter file: `adapters/quantum-age/articles.ts`
- Migration risk: Existing article URLs must keep working on the public site.
- Test required: Open one Insights article in the editor after the shell stops using the literal.

### src/components/editor/panels.tsx

- Current file: `src/components/editor/panels.tsx`, lines 75–80
- Current behavior: A group titled “Insights drafts” opens `/insights/${post.slug}`.
- Why it is site-specific: The panel names one collection.
- Generic replacement: A page or article list from the adapter.
- Destination adapter file: `adapters/quantum-age/articles.ts`
- Migration risk: Draft posts must still be listed for Quantum Age.
- Test required: The Pages panel still lists “A note from the team” until the generic list replaces it, then the adapter pattern still finds that slug.

### src/lib/manifest.ts

- Current file: `src/lib/manifest.ts`, line 27
- Current behavior: `blog.collection` must be the literal `"insights"`.
- Why it is site-specific: Another site cannot name its collection.
- Generic replacement: Article behavior on the adapter, with no required collection name in the platform.
- Destination adapter file: `adapters/quantum-age/articles.ts`
- Migration risk: Stored `Website.manifest` JSON uses this literal.
- Test required: `tests/unit/qa-adapter-articles.test.ts`

### src/lib/library.ts

- Current file: `src/lib/library.ts`, lines 45 and 47
- Current behavior: Search copy says “Search pages and Insights”. The catalog has `section:insights-summary`.
- Why it is site-specific: The Add catalog names one site’s writing section.
- Generic replacement: Registered components. The platform catalog has no Insights entry.
- Destination adapter file: `adapters/quantum-age/components/insights.ts`
- Migration risk: Existing pages that contain an insights-summary section must still render.
- Test required: Quantum Age still shows the summary. A second site’s catalog does not.

### src/lib/content-schema.ts

- Current file: `src/lib/content-schema.ts`
- Current behavior: Blog defaults mention Insights. Flow kind `insights`, layout `insights`, preset `insights`, section type `insights-summary`, route `/insights`, and template `insights-landing` are schema literals.
- Why it is site-specific: The document schema knows one site’s section types.
- Generic replacement: A `custom` node whose component id is registered by the adapter. Templates live on the adapter.
- Destination adapter file: `adapters/quantum-age/components/insights.ts` and `adapters/quantum-age/templates.ts`
- Migration risk: Version 3 drafts contain these types. The migrator must map them, not drop them.
- Test required: `tests/unit/convert-section.test.ts`

### Overlay article routes

- Current files: `overlays/quantum-age/src/app/insights/page.tsx`, `overlays/quantum-age/src/app/insights/[slug]/page.tsx`, `overlays/quantum-age/src/components/site/structured-article.tsx`, `overlays/quantum-age/src/components/site/flow-section.tsx`, `overlays/quantum-age/src/components/site/home-canvas.tsx`
- Current behavior: The public site renders the Insights index, HTML articles, structured drafts, and the home Insights preset. The article page tells the editor that a published article stays as it was published.
- Why it is site-specific: These are Quantum Age pages. The hub must not import them.
- Generic replacement: The site keeps its routes. The adapter describes article capabilities. The hub does not import these files.
- Destination adapter file: `adapters/quantum-age/articles.ts`
- Migration risk: Public article HTML must not be rewritten by the audit or by a later editor change that lacks a backup.
- Test required: `/insights` and one article slug still return 200 on the public build.

Also named in the hub, and covered again by later audit sections: `src/lib/publish.ts` and `src/lib/publish-git.ts` allow `src/app/insights/page.tsx` and `src/app/insights/[slug]/page.tsx`. `src/components/editor/dialogs.tsx` offers template `insights-landing`. `src/components/editor/inspector/index.tsx` labels a mode “Insights list”. `src/lib/page-documents.ts` builds an insights-summary section and an insights-landing template. `src/app/api/sites/[websiteId]/blog/route.ts` returns “Insights draft saved.”

## Hero

The platform node for a hero is a registered component. It is not `preset: "hero"` and it is not a `heroImage` field.

### src/lib/content-schema.ts

- Current file: `src/lib/content-schema.ts`, `heroImageSchema` at line 11 and the preset section at line 358
- Current behavior: A hero image has `placement` `with-copy` or `beside-mark`. Home defaults include `heroImage`. Preset sections may carry `heroImage`.
- Why it is site-specific: Placement beside a brand mark is this site’s hero, not a generic image.
- Generic replacement: An image node plus a registered hero component whose props live on the adapter.
- Destination adapter file: `adapters/quantum-age/components/hero.ts`
- Migration risk: Home hero content must survive document conversion, including placement and alt text.
- Test required: `tests/unit/qa-component-hero.test.ts` feeds current hero fields. The home preview still shows the hero.

### src/lib/page-documents.ts and src/lib/publish.ts

- Current file: `src/lib/page-documents.ts` `heroFields` at line 234, called from `src/lib/publish.ts` line 62
- Current behavior: Publish sync writes `src/content/pages/home.json` from hero fields.
- Why it is site-specific: The public home page reads a Quantum Age-shaped JSON file.
- Generic replacement: The Quantum Age serializer writes `home.json`. The platform serializer does not know hero fields.
- Destination adapter file: `adapters/quantum-age/serialize.ts`
- Migration risk: Stopping the write would blank the public hero. The serializer must keep the current keys.
- Test required: `tests/unit/qa-serialize.test.ts`

### src/components/editor-shell.tsx and src/lib/editor-ops.ts

- Current file: `src/components/editor-shell.tsx` line 331 and `src/lib/editor-ops.ts` line 355
- Current behavior: Selecting or replacing an image on a preset reads and writes `heroImage`.
- Why it is site-specific: The editor special-cases one component’s image field.
- Generic replacement: A generic image prop on the registered hero.
- Destination adapter file: `adapters/quantum-age/components/hero.ts`
- Migration risk: Image replace on the home hero must still change only that image.
- Test required: The media Playwright spec, after the hero is a registered node.

### overlays/quantum-age/src/components/site/hero-content-image.tsx

- Current file: `overlays/quantum-age/src/components/site/hero-content-image.tsx`
- Current behavior: Renders the home hero image. The hub lists this file in `ADAPTER_FILES`.
- Why it is site-specific: It is a Quantum Age page component.
- Generic replacement: The site keeps the renderer. The adapter names it. `src/platform` does not import it.
- Destination adapter file: `adapters/quantum-age/components/hero.ts`
- Migration risk: Public hero layout. Do not restyle this file during the architecture move.
- Test required: Home preview still matches the baseline screenshot.

## Logo

The platform only knows an image or a custom component id. It does not know this site’s logo.

### src/lib/content-schema.ts

- Current file: `src/lib/content-schema.ts`, flow kind `brand-mark` at line 227, and `chrome.header` logo plus `favicon`
- Current behavior: A flow block kind `brand-mark` is a first-class kind. Header chrome stores a logo path.
- Why it is site-specific: “Brand mark” is this site’s rings graphic, not a generic node type.
- Generic replacement: An image node or a registered component. Header logo is a prop on the registered header.
- Destination adapter file: `adapters/quantum-age/components/logo.ts`
- Migration risk: The locked rings block must stay locked and visible.
- Test required: `tests/unit/qa-component-logo.test.ts`. Header logo still loads in the preview.

### src/lib/flow-seed.ts

- Current file: `src/lib/flow-seed.ts`, line 73
- Current behavior: Seeds block `blk_rings` as kind `brand-mark`, named Rings, locked.
- Why it is site-specific: The rings are this site’s mark.
- Generic replacement: Seed data on the adapter, with the logo component locked there.
- Destination adapter file: `adapters/quantum-age/seed.ts` and `adapters/quantum-age/components/logo.ts`
- Migration risk: Re-seeding would duplicate or unlock the mark. Do not re-seed drafts.
- Test required: The home preview still shows the rings. A client editor still cannot delete them if that is true today.

### src/components/editor/inspector/index.tsx and src/components/editor/panels.tsx

- Current file: `src/components/editor/inspector/index.tsx` line 24 and `src/components/editor/panels.tsx` line 147
- Current behavior: The inspector and layers label `brand-mark` as “Logo mark” or “Logo”.
- Why it is site-specific: The hub translates one site’s block kind into a label.
- Generic replacement: The registry display name. The platform labels a node by its generic type or the registry name.
- Destination adapter file: `adapters/quantum-age/components/logo.ts`
- Migration risk: The label can change from “Logo” to the registry name. The graphic must not change.
- Test required: Layers shows the registry name for that node and does not hardcode it in `src/platform`.

## Tokens

Platform theme tokens are an open list of `{ id, value }`. The names `ink`, `plum`, and `green` must not appear as required keys in `src/platform`.

### src/lib/content-schema.ts

- Current file: `src/lib/content-schema.ts`, lines 296–303
- Current behavior: `theme` requires `ink`, `plum`, `green`, `paper`, `font` of `serif` or `sans`, `button` of `filled` or `outline`, and `spacing` of `compact`, `comfortable`, or `roomy`.
- Why it is site-specific: Those color names are this brand’s palette.
- Generic replacement: Adapter tokens with their own ids. A token reference in a node is `token:<id>`, and the id is not required by the platform.
- Destination adapter file: `adapters/quantum-age/theme.ts`
- Migration risk: Stored drafts contain these keys. The migrator must copy the hex values onto adapter token ids.
- Test required: `tests/unit/qa-adapter-theme.test.ts` and `rg "plum" src/platform` empty after the theme module exists.

### src/lib/flow-seed.ts

- Current file: `src/lib/flow-seed.ts`, lines 46–54
- Current behavior: Seeds ink `#231a25`, plum `#70456e`, green `#3d5f12`, paper `#f7f5f0`, serif, filled buttons, comfortable spacing.
- Why it is site-specific: These are the brand values.
- Generic replacement: The same values on the adapter theme. They are not platform defaults.
- Destination adapter file: `adapters/quantum-age/theme.ts`
- Migration risk: A second site must not inherit these hex values.
- Test required: Harbor’s palette test later. Quantum Age preview colors stay as they are.

### overlays/quantum-age/src/app/layout.tsx

- Current file: `overlays/quantum-age/src/app/layout.tsx`, line 61
- Current behavior: Writes `--ink`, `--plum`, `--paper`, and `--green` from the draft theme.
- Why it is site-specific: The public layout applies this site’s tokens.
- Generic replacement: The site layout keeps doing this. The hub does not invent the variable names.
- Destination adapter file: `adapters/quantum-age/theme.ts`. The layout file stays in the overlay.
- Migration risk: Editing the layout would change the public site. Do not edit it in the token move except to read values.
- Test required: Public home colors match the baseline screenshot. `git diff` on this layout stays empty during the token move.
