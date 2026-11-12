# Test results

`npm test`: 461 passed, 5 failed. The failures are the missing Quantum Age draft snapshot in `document-validate`, `draft-backup`, `draft-put-site`, `migrate-rollback`, and `qa-adapter-theme`. Log: `docs/test-report/npm-test.txt`.

Typecheck exited 0. Log: `docs/test-report/typecheck.txt`.

Lint exited 1. Seven errors are existing React hook findings. Generated Harbor build output is ignored. Log: `docs/test-report/lint.txt`.

| Step | Log | Result |
| --- | --- | --- |
| 19.1 Schemas | `docs/test-report/schemas.txt` | Fail. One snapshot assertion. |
| 19.2 Migration | `docs/test-report/migration.txt` | Fail. Backup, version 3 save, and rollback. `migrate:dry` exited 0 and wrote no rows. |
| 19.3 Adapters | `docs/test-report/adapters.txt` | Fail. Quantum Age color tokens need the missing draft. Both adapters still parse. |
| 19.4 Registry | `docs/test-report/registry.txt` | Pass |
| 19.5 Capabilities | `docs/test-report/capabilities.txt` | Unit pass. Harbor hides review and the contact form. |
| 19.6 Inspector | `docs/test-report/inspector.txt` | Unit pass. A separate Harbor tide-clock field click was not added. |
| 19.7 Elements | `docs/test-report/elements.txt` | Pass |
| 19.8 Reparent | `docs/test-report/reparent.txt` | Unit pass. A browser drag was not run. |
| 19.9 Layout | `docs/test-report/layout.txt` | Pass |
| 19.10 Canvas coordinates | `docs/test-report/canvas-coordinates.txt` | Pass |
| 19.11 Responsive | `docs/test-report/responsive.txt` | Pass |
| 19.12 Grouping | `docs/test-report/grouping.txt` | Pass |
| 19.13 History | `docs/test-report/history.txt` | Pass |
| 19.14 Drafts | `docs/test-report/drafts.txt` | Fail. Same snapshot backup and version 3 save. |
| 19.15 Isolation | `docs/test-report/isolation.txt` | Unit pass. See `docs/builder/isolation.md` for checks that were not re-run in the browser. |
| 19.16 Quantum Age build | `docs/test-report/qa-build.txt` | Blocked |
| 19.17 Harbor build | `docs/test-report/harbor-build.txt` | Pass on retry |
| 19.18 Login | `docs/test-report/login.txt` | Pass |
| 19.19 Product routes | `docs/test-report/product-routes.txt` | Pass |
| 19.20 Accessibility | `docs/test-report/a11y.txt` | Pass |
| 19.21 Console | `docs/test-report/console.txt` | Pass, with the allowed 404s listed there. |
| 19.22 Hydration | `docs/test-report/hydration.txt` | Pass |
| 19.23 Overflow | `docs/test-report/overflow.txt` | Fail. Editor document is 3px wider at 390. |
| 19.24 Publish | `docs/test-report/publish.txt` | Mocked local save passed. An unmocked GitHub review was not run. |
| 19.25 Version 3 removal | `docs/migration/compatibility-window.md` | Blocked. Dual-write remains. |

Browser demos: `docs/test-report/demos.txt`.
