# Editor quality sprint report

This is the final report for the editor UX and full-site quality sprint on `cursor/editor-chrome-rebuild-eb8a`.

## 1. Starting point

| Item | Found |
|---|---|
| Repository instructions | `AGENTS.md` holds only the Next.js 16 agent rules written by `next dev`. `docs/architecture.md` describes the hub, preview, and publishing model. |
| Cursor configuration | No `.cursor/` folder, no rules, no `environment.json`. |
| MCP servers | None configured in the repository or the user profile. |
| Skills | `hallmark` (nutlope/hallmark, 1.1.0) and `humanizer` (blader/humanizer, 3.1.0) in `.agents/skills/`, pinned by hash in `skills-lock.json`. |
| Package manager | npm with `package-lock.json`. Node 22.14.0. |
| Branches | `main`, `cursor/website-editor-eb8a`, `cursor/editor-chrome-rebuild-eb8a` (this sprint). |
| Working tree | Clean at the start of the sprint. |
| Running services | Postgres on the local socket, the hub dev server on 3210, and the Quantum Age preview started by the hub on 4600. |
| Tests | None before this sprint besides `npm run verify` and `npm run check`. |

## 2. What was installed

| What | Source | Command | Notes |
|---|---|---|---|
| Hallmark skill | https://github.com/nutlope/hallmark (commit 13ac0ec) | `npx skills add nutlope/hallmark --agent cursor --yes` | Markdown only. No credentials, no network calls. |
| Humanizer skill | https://github.com/blader/humanizer (commit 225a6f3) | `npx skills add blader/humanizer --agent cursor --yes` | Markdown only, MIT. No credentials, no network calls. |
| `@playwright/test` 1.64.0 | npm registry | `npm install -D @playwright/test` | Browser tests. |
| Chromium headless shell | Playwright CDN | `npx playwright install --with-deps chromium` | Stored in `~/.cache/ms-playwright`, not in the repository. |

No secrets, tokens, or API keys were added. The skills installer reported "Safe" and 0 alerts from two scanners, and "Med Risk" from Snyk, which rates any skill that runs with agent permissions that way.

## 3. Route inventory

`docs/route-audit.md` lists 138 routes: 8 in the editor app and 130 on the website, including 115 Insights articles. The website rows were checked on a production build at 1280, 768, and 390 pixels. Every one of those 129 loads (128 routes plus a missing address) returned the expected status, with no console errors, hydration warnings, horizontal overflow, or editor markers. An unknown custom address returns 404.

## 4. Selection and dragging

A click selects and does not move anything. Dragging across text selects words. Only the grip reorders a section, one undo puts it back, and Escape cancels a drag before it posts a change. Delete is ignored while text is being edited. These are covered by `tests/e2e/editor.spec.ts` and the gesture unit tests.

## 5. Toolbar and menus

The selection toolbar uses icon buttons with accessible names. More actions opens a menu that arrow keys can move through, and Escape returns focus to the button. The account menu and the Add page dialog do the same from the keyboard. Enter on a toolbar button is no longer swallowed by the canvas keyboard handler.

## 6. Canvas, zoom, and preview

The desktop preview scales to fit between the panels, with a zoom control in the status bar. The clean preview link opens the current page with the canvas off. Image `srcset` candidates are rewritten through the preview proxy, and the preview can return a real 404 for a missing page.

## 7. Inspector

The properties panel shows only the tabs that apply to the selection. Text, button, image, section, and page each have their own fields. Page settings and search details are separate tabs. A page you created can be given a new web address; a built-in page cannot. An invalid or taken address is rejected in the field and is not saved.

## 8. Text formatting

Each control was checked for: it applies to the selection, the stored markup uses the site's own tags, it saves, undo removes it, redo restores it, it survives a reload, the clean preview matches, a second press turns it off where that applies, and the keyboard shortcut matches the button.

| Control | Result | What was checked |
|---|---|---|
| Bold | PASS | Applies, saves, reloads, matches the preview, undoes, redoes, and toggles off |
| Italic | PASS | Same path as Bold |
| Underline | PASS | Same path as Bold |
| Link | PASS | Same path as Bold. An insecure or malformed address is refused |
| Remove link | PASS | Removes the whole link |
| Text color | PASS | Same path as Bold |
| Clear formatting | PASS | Clears the marks in the selection |
| Ctrl+B | PASS | Same stored result as the Bold button |
| Paste | PASS | Formatted clipboard text is inserted as plain text |
| Enter | PASS | Finishes a heading, and adds a line break in a paragraph |

Nothing was removed. Strikethrough and highlight were not added.

## 9. Adding sections and elements

The gap between sections inserts at that spot. With a section selected, Add puts an element inside it. Duplicate, hide, show, delete, and undo all work, and a section can be saved as a template and inserted again. Alt plus the arrow keys moves the selected section.

## 10. Library

The Add panel searches, filters by category, and shows recommended items for the current target. Items insert by click. Saved templates appear in the library.

## 11. Editor states

The status shows Saved, Unsaved changes, and Not saved with Retry. Leaving during an unsaved change is blocked. A failed save, a failed upload, an unsupported file, an insecure link, and a failed review each explain what happened. Reduced motion shortens editor transitions. The focus ring uses the editor's own focus color, which is now defined in the editor stylesheet so it is actually emitted.

## 12. Hallmark

`docs/hallmark-audit.md` records the audit. One critical production-build failure and the major editor and public-page defects listed there were fixed. The public site keeps its brand, the rings mark, and the existing compositions.

## 13. Copy review

`docs/copy-review.md` lists the ten marketing edits that were applied and the passages that were flagged and left alone. The 115 Insights articles were counted and not rewritten.

## 14. Automated tests

Unit tests cover gestures, drop targets, toolbar placement, rich-text marks, section and block operations, slugs, links, and page addresses. Browser tests cover the editor, formatting, structure, media, pages, failures, accessibility, and every public route. `npm test` is 44 passing tests.

## 15. Hands-on browser pass

A headed browser opened the editor, selected a section, opened the selection menu, the Add and Media panels, the new-page dialog, and the review dialog, then loaded the public home, contact, insights, and one article. The contact page was checked at 390 pixels wide. The only console message was the development preview's sandbox cookie warning, which the production build does not log.

## 16. Console, hydration, and keys

The public production crawl reported no console errors, hydration warnings, or React key warnings. The hub build completes. The preview iframe in development logs one sandbox warning when Next.js dev tools read `document.cookie`. That message is filtered in the editor tests and does not appear on the production site.

## 17. Commands

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass, after ignoring the local `.qa` scratch directory |
| `npm test` | Pass, 44 tests |
| `npm run verify` | Pass |
| `npm run build` | Pass |
| `SITE_URL=http://127.0.0.1:4700 npm run test:e2e` | Pass, 58 tests |

The route project reads `SITE_URL` and otherwise walks the signed preview. This pass used the production build on port 4700. An earlier run reported one console error, `missing ) after argument list`, during the link formatting test while the dev server was recompiling a dialog change. That test passed on its own, and the full suite then passed with 58 tests.

## 18. Secrets

`git ls-files` shows `.env.example` only. `.env` and `.env.local` are ignored. A search of the tracked tree found no live access keys, GitHub tokens, or private keys. `.env.example` contains empty placeholders and a local Postgres URL.

## 19. Deviations

- The draft API does not detect a stale save. A later write overwrites an earlier one, and the failures test records that. There is no conflict message to show.
- In the preview, the editor region wrapper reads the request headers before streaming, so a missing page is a real 404. The public pages still render that wrapper inside Suspense.
- Preview image requests for `brand`, `insights-images`, and `team` skip the preview token so `next/image` can fetch its candidates. Uploads under `/media` still require the token.
- Pages you create can change their web address, and on-site links to the old address follow. Built-in pages keep their address. Saving that change updates the existing page row. Inserting a second row with the same id was what made the first save fail.
- Focus colors live on `.ed-root` as well as in `globals.css`. The shared file's tokens were not present in the served editor stylesheet, so the focus ring computed to nothing.
- Dialogs move focus to their first field in script. The `autoFocus` attribute was taking focus before the dialog could remember the button that opened it, so Escape could not return there.

## 20. Remaining issues

- Two saves of the same draft do not conflict. The last write wins.
- Submit for review confirms your identity, then stores the change. With the GitHub App unconnected, the result says the change was saved locally and the live site is unchanged. It does not open a pull request.
- The development preview logs the sandbox cookie warning described above.
- The hub error screen was not forced by throwing, and the loading screen was only seen while the canvas connected.
- Insights article copy was reported in `docs/copy-review.md` and not rewritten.
