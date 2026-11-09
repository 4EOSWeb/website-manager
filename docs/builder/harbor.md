# Harbor compatibility

Harbor is a separate fixture. It is not a renamed Quantum Age tree. Source: `fixtures/harbor`.

The production build command was `env -u EDITOR_PREVIEW npm run build` in `fixtures/harbor`. The first invocation stopped on the Next.js security notice. The retry exited 0. Routes include `/`, `/work`, `/work/[project]`, `/studio`, `/journal`, and `/visit`. The log is `docs/test-report/harbor-build.txt`.

The custom component is `harbor.tide-clock`. The dynamic route is `/work/:project`.
