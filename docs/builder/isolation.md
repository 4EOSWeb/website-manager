# Cross-site isolation

Unit log: `docs/test-report/isolation.txt`. That run exited 0.

| Check | Test | Result |
| --- | --- | --- |
| 16.1 Components | `tests/unit/isolation-components.test.ts` | Pass in the isolation log |
| 16.2 Colors | `tests/unit/isolation-colors.test.ts` | Pass in the isolation log |
| 16.3 Fonts | `tests/unit/isolation-fonts.test.ts` | Pass in the isolation log |
| 16.4 Media | `tests/unit/isolation-media.test.ts` and `tests/e2e/isolation-media.spec.ts` | Unit pass. Browser spec was not re-run in this pass |
| 16.5 Routes | `tests/unit/isolation-routes.test.ts` | Pass in the isolation log |
| 16.6 Pages | `tests/unit/isolation-pages.test.ts` | Pass in the isolation log |
| 16.7 Drafts | `tests/unit/isolation-drafts.test.ts` | Pass in the isolation log |
| 16.8 Templates | `tests/unit/isolation-templates.test.ts` and `tests/e2e/isolation-templates.spec.ts` | Unit pass. Browser spec passed in this pass |
| 16.9 Navigation | `tests/e2e/isolation-nav.spec.ts` | Not re-run in this pass. Not marked pass |
| 16.10 Locks | `tests/unit/isolation-locks.test.ts` | Pass in the isolation log |
| 16.11 Publications | `tests/unit/isolation-publish.test.ts` | Pass in the isolation log |
| 16.12 Repository | `tests/unit/isolation-repo.test.ts` | Pass in the isolation log |
| 16.13 Branches | `tests/unit/isolation-branches.test.ts` | Pass in the isolation log |
| 16.14 Memberships | `tests/unit/isolation-membership.test.ts` | Pass in the isolation log |
| 16.15 Access | `tests/unit/isolation-access.test.ts` and `tests/e2e/isolation-access.spec.ts` | Unit pass. Browser spec passed. Harbor-only users see “You do not have access to this website.” |
