# Integration levels

Level 1 is described in `docs/adapters/level-1.md`. The site keeps its pages. The hub edits exposed text, links, and images. It does not rewrite arbitrary React from the DOM, and it does not create a canvas.

Level 2 is described in `docs/adapters/level-2.md`. Page creation, canvas, and registered components are available when the capability flags say so.

Settings shows the current level to an administrator. Harbor and Quantum Age both report Level 2.

Moving from level 1 to level 2 means filling in the level 2 adapter fields and setting `level: 2`. The hub is not forked.
