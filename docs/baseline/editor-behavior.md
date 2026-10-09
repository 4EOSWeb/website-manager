# Editor behavior baseline

Captured on `cursor/editor-chrome-rebuild-eb8a` against `http://127.0.0.1:3210/sites/web_quantum_age/editor`, signed in as the development administrator. The Playwright editor project had just passed (55 tests). A read-only pass then opened the editor, the Add panel, and the Pages panel.

## What the screen shows

- The site name is Quantum Age. The open page is Home. The address field says “Built-in pages keep their address.”
- The top bar has Preview and Submit for review. Save status can read Saved.
- The tool rail is Add, Pages, Layers, Styles, and Media.
- Pages in the menu: Home, Solutions, Approach, About, Team, References, Insights.
- Pages not in the menu: Contact, Privacy, Terms.
- Insights drafts lists “A note from the team.”
- Device control is Desktop. Zoom offers Fit, 50%, 75%, and 100%.

## Drag

Dragging a flow block reorders it inside its current parent. The grip reorders sections, and one undo puts them back. There is no general reparent into another section. Freeform is a library section type named “Freeform zone,” not a layout mode on every container. Freeform items move only inside that zone or a preset overlay. Escape cancels a drag. Dragging across text selects words instead of moving the section.

## Library

Add lists Sections, Text, Media, Forms, Marketing, Testimonials, FAQ, Calls to action, and Freeform zone. Entries include Hero, Feature cards, Insights summary, Contact form, and Freeform zone. Click adds below the selected section. Drag onto the page is also offered.

## Articles, routes, save, and review

Insights article routes are handled as Insights drafts, separate from ordinary pages. Built-in pages keep their addresses. Save moves through unsaved, saving, and saved. Submit for review asks the signed-in person to confirm identity before sending. Without the GitHub App, review saves a local branch.

## Draft check

Opening Add marked the document unsaved and a save finished. `draft_0ddb6f7c7f7a.updated_at` moved from `2026-10-09 19:06:31` to `2026-10-09 19:07:59`. After `restoreSnapshot`, both Quantum Age draft payloads match `tests/e2e/.auth/drafts.json`. No page content was intentionally edited. `draft_de7f110716c9` did not change.
