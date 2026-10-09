# Platform

This directory is the site-independent editor core.

- Do not import from `overlays/`.
- Do not put a site name, a site route list, or a brand token in this directory.
- The website preview stays in an iframe.
- The hub and the preview keep talking with `postMessage`.
- Editor screens do not import this directory until a later step wires them.
