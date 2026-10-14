# Version 3 compatibility window

The editor still reads and writes version 3 drafts. The visual document is stored beside them. These shims stay until the step named here. None of them are removed by this note.

| Shim | Where | Remove |
| --- | --- | --- |
| Seed re-export | `src/lib/flow-seed.ts` re-exports the adapter seed | Step 19.25 |
| Publish file fallback | `ADAPTER_FILES` in `src/lib/publish.ts` | Step 19.25 |
| Version 3 parser import | `src/platform/migrate/parse-v3.ts` imports `siteDraftSchema` | Step 19.25 |
| Dual draft store | `draft_data` stays version 3. `visual_document` holds version 1. A version 3 save does not clear `visual_document`. | Step 19.25 |
| Legacy reorder messages | Same-section and cross-section block moves use `4eos-reparent`. The hub no longer listens for `4eos-reorder-block`. | Removed in step 11.31 |
| Preview website id | A preview message must include this website’s id. A missing id is ignored. | Removed in step 11.31 |
| Version 3 layers list | Layers shows the visual page tree when a visual document is present. The version 3 section list stays as the fallback. | Step 19.25 |
| Version 3 inspector | A generic node shows a generated name, id, and component. Text, label, quote, and title sit on a generated Content tab. A styleable button shows color and background, and the color list comes from the active adapter. A generic container can switch Flow, Stack, Grid, and Canvas after a confirm, and undo restores the previous layout. A canvas item shows Scale, Reflow, and Custom, plus the inheritance label and reset. Flow text does not show that strategy. A generic node can hide on desktop, tablet, or mobile. Hiding on all three marks it hidden and clears that list. A generated button can set a destination and open in a new tab. An invalid address, including a javascript address, is not saved. A generated image can choose, replace, and crop a picture, and set alt, fit, and focal. Replacing it writes that picture’s source only. An empty description stays marked “Describe the picture.” until alt text is set. A generated button can edit its label, destination, size, font, colors, and hover, focus, and disabled states on that same node. Fonts come from the active adapter. Version 3 selections keep their Content, Design, and Layout tabs until generated fields cover that control. | Step 19.25 |

Check: `rg "step 19.25"`.

The version 3 schema, the seed re-export, and the publish fallback are also listed under Temporary compatibility in `docs/architecture-separation.md`.
