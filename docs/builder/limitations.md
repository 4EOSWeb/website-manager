# Known limitations

- Level 1 cannot rewrite arbitrary React from the DOM.
- Canvas editing requires level 2 and the free-canvas capability.
- GitHub review needs the GitHub App. Without it, a successful send is saved on this copy and no pull request is opened.
- Stale-draft conflict detection is not a hard 409. An older copy can still overwrite a newer one. `tests/e2e/failures.spec.ts` covers that behavior.
- HTML article conversion is administrator-only and lossy for markup that is not headings or paragraphs.
- The editor document at 390px overflows by 3px. Recorded in `docs/test-report/overflow.txt`.
- Version 3 dual-write is still in place. Step 19.25 was blocked. See `docs/migration/compatibility-window.md`.
- Document schema, backup, version 3 save, rollback, and Quantum Age color-token tests fail because the historical Quantum Age draft snapshot is not in this database. The tests were not deleted.
- The public Quantum Age production build was not run. There is no `.qa/public-site` checkout.
- Canvas demos that need a live preview frame are marked in `docs/builder/demos.md` from the demo run. A failed demo stays failed.
- This program is not complete while the Quantum Age production build and the version 3 removal are blocked.
