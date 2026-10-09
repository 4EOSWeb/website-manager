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
