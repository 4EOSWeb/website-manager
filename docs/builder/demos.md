# Demonstrations

Screenshots are in `docs/builder/demos/`. The browser run is `docs/test-report/demos.txt`.

1. Create a button, set its label and link, resize it, move it, and set a mobile position. Failed. The Harbor canvas rendered, and this pass did not complete that gesture sequence.
2. Create a heading and an image, group them, move the group, duplicate it, and ungroup it. Failed. The sequence was not run.
3. Drag a node into another parent. Failed. The sequence was not run.
4. Convert a structured section to canvas, move the children, and undo. Failed. The sequence was not run.
5. Create a blank page with no Quantum Age hero id. Passed. `tests/e2e/builder-demos.spec.ts` created a blank canvas page. The page HTML does not contain `quantum-age.hero`. Screenshot: `docs/builder/demos/blank-page.png`.
6. Load Harbor without editing `src/platform` for that visit. Passed. The editor opened Harbor & Co. Screenshot: `docs/builder/demos/harbor-editor.png`. This pass did not edit `src/platform` to load Harbor. A later lint ignore for `fixtures/**/.next/**` is hub tooling, not a Harbor component.
7. Show the tide clock in the Harbor registry and the Add panel. Passed. The Add panel shows Tide clock and does not show Contact form. Screenshot: `docs/builder/demos/tide-clock.png`.

`npm test` after the last code change: 461 passed, 5 failed. The five failures are the missing Quantum Age draft snapshot. Typecheck exited 0. Lint exited 1 with 7 existing React hook errors in the editor shell, generated inspector, and layers. Logs: `docs/test-report/npm-test.txt`, `docs/test-report/typecheck.txt`, `docs/test-report/lint.txt`.

Required demos 1 through 4 are failed, so this branch is not marked complete.
