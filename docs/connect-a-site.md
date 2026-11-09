# Connect a site

The hub is not edited for a new site. Add a folder under `adapters/` or `fixtures/` with an `adapter.ts`. Discovery is by that folder convention. There is no website-id switch in `src/platform`.

Harbor is the worked example. Its files are `fixtures/harbor/adapter.ts`, `fixtures/harbor/registry.ts`, and `fixtures/harbor/templates.ts`. The adapter sets capabilities, commands, routes, and `workspace.root`. The tide clock renderer stays in the Harbor bundle. The hub only reads the registry description.

Then open Connect a website and read the compatibility report. Activate stays off until every section passes. Tokens and repository credentials stay on the server. The form does not ask for them.

Do not copy another site’s components, tokens, or CSS into the new folder.
