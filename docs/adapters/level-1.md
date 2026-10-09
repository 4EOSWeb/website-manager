# Level 1 content adapter

Level 1 is the safe content adapter. A site keeps its existing pages and components. The hub discovers routes, previews the site in an iframe, and edits the text, links, and images the adapter exposes. Everything else stays provider-managed.

## Allowed

- Discover the site's routes and open them in the editor.
- Preview the site in an iframe. The hub talks to that frame with postMessage.
- Edit exposed text, links, and images.
- Leave other components provider-managed, including layout, navigation, and custom sections.

## Refused

- Rewrite arbitrary React from the DOM. The hub does not understand arbitrary React.
- Create canvas layouts.
- Reparent elements.
- Turn on free canvas, page creation, or custom components. Those flags stay off at level 1.

## Upgrade

Implement the level 2 fields and set `level: 2`. The product UI does not show a level badge yet.
