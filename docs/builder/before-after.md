# Architecture before and after

## Before

The editor stored a version 3 `SiteDraft` in `src/lib/content-schema.ts`. Pages, sections, and freeform items were that draft. Reserved routes, the static library, and `ADAPTER_FILES` in `src/lib/publish.ts` were Quantum Age paths. The separation audit is `docs/architecture-separation.md`.

## After

A version 1 visual document lives beside the version 3 draft. Layout modes are flow, flex, grid, and canvas. The adapter contract is `src/platform/adapter/index.ts`. Components register through the registry. Harbor is a second site with its own folder.

Version 3 is still accepted by the editor. Step 19.25 did not remove that compatibility. See `docs/migration/compatibility-window.md`.
