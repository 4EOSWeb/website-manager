# Builds

## Quantum Age public site

Not run. Blocked. See `docs/test-report/qa-build.txt`.

## Harbor

```
cd fixtures/harbor && env -u EDITOR_PREVIEW npm run build
```

The first run stopped on the Next.js security notice. The retry exited 0. Log: `docs/test-report/harbor-build.txt`. Routes include `/work` and `/work/[project]`.

## Hub

```
npm run build
```

The first run compiled, then stopped on the Next.js security notice. The retry exited 0. Log: `docs/test-report/hub-build.txt`. Nothing was deployed.
