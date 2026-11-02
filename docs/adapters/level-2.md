# Level 2 builder adapter

Level 2 is the full visual builder. A site upgrades by implementing this contract and registering its components. The hub is not forked.

`src/platform` must not import the site. Preview stays in an iframe. The hub does not render site components.

## What the builder can do

- Create and delete pages and elements.
- Reparent an element onto another parent.
- Convert a layout among flow, flex, grid, and canvas.
- Place elements on a canvas and choose scale, reflow, or custom breakpoints.
- Edit pages, navigation, and shared header and footer regions when those flags are on.
- Use the component registry for custom components.
- Set responsive props per breakpoint.
- Store a version 1 visual document.
- Send a review branch from an allowlist of files.

## Capability flags

Set each flag explicitly. Level 2 may turn them on. Level 1 keeps `supportsFreeCanvas`, `supportsPageCreation`, and `supportsCustomComponents` off.

- `supportsPageCreation`
- `supportsBlog`
- `supportsNavigationEditing`
- `supportsFreeCanvas`
- `supportsStructuredSections`
- `supportsThemeEditing`
- `supportsCustomComponents`
- `supportsForms`
- `supportsSharedLayouts`
- `supportsReviewPublishing`

## Contract modules

The fields live in `src/platform/adapter/`:

- `metadata.ts` and `level.ts` identify the site and the integration level.
- `capabilities.ts` holds the flags above.
- `router.ts`, `commands.ts`, and `routes.ts` describe how the site builds and which paths exist.
- `page-rules.ts` and `page-capabilities.ts` decide which pages can be created and which regions can be edited.
- `navigation.ts`, `theme.ts`, `fonts.ts`, and `breakpoints.ts` describe menus, tokens, type, and widths.
- `components.ts` and `templates.ts` reserve component ids and starter documents.
- `shared-layout.ts` and `articles.ts` describe the header, footer, and article routes.
- `media.ts` and `drafts.ts` describe files and draft scope.
- `validate-hook.ts` and `serialize.ts` check a document and write site files.
- `preview.ts` locks the iframe postMessage protocol.
- `publish.ts` and `allowlist.ts` describe review publishing and the files it may touch.
- `version.ts` accepts contract version 1.

`parseAdapter` in `src/platform/adapter/index.ts` checks the whole contract.
