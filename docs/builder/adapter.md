# Site adapter

`parseAdapter` in `src/platform/adapter/index.ts` requires:

- `version` — `1`
- `level` — `1` or `2`
- `site` — id, name, production URL, repository, default branch
- `capabilities` — the boolean flags in `src/platform/adapter/capabilities.ts`
- `router` — kind and root
- `commands` — install, dev, build, preview
- `routes` — static paths
- `pageRules` — create, delete, reserved routes, slug pattern
- `pageCapabilities` — what a page may edit
- `navigation` — source, editable, items
- `theme` — tokens
- `fonts`
- `breakpoints`
- `components`
- `templates`
- `sharedLayout`
- `articles`
- `collections` — optional list of articles and forums a site can add. Each item has an id, a name, a kind (`article` or `forum`), a `:slug` address, and a body kind. When the list is omitted, the editor derives one collection from `articles` if articles are enabled. Article collections require `supportsBlog`. A forum does not. Forms stay on `supportsForms` and are added onto a page.
- `media`
- `drafts`
- `preview` — iframe `postMessage`
- `publish`
- `workspace` — optional root, used by Harbor
- `routeCapabilities`, `validateDocument`, and `serialize` — optional

Level notes: `docs/adapters/level-1.md` and `docs/adapters/level-2.md`.

The minimal example that is not Quantum Age is `tests/fixtures/adapters/sample/adapter.ts`. `tests/unit/adapter-doc-example.test.ts` parses it.
