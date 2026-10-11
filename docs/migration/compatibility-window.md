# Version 3 compatibility window

The editor still reads and writes version 3 drafts. The visual document is stored beside them. These shims stay until the step named here. None of them are removed by this note.

| Shim | Where | Remove |
| --- | --- | --- |
| Seed re-export | `src/lib/flow-seed.ts` re-exports the adapter seed | Step 19.25 |
| Publish file fallback | `ADAPTER_FILES` in `src/lib/publish.ts` | Step 19.25 |
| Version 3 parser import | `src/platform/migrate/parse-v3.ts` imports `siteDraftSchema` | Step 19.25 |
| Dual draft store | `draft_data` stays version 3. `visual_document` holds version 1. A version 3 save does not clear `visual_document`. | Step 19.25 |
| Legacy reorder messages | Page and section move controls still use the version 3 editor messages | Step 11.31 |

Check: `rg "step 19.25"`.

The version 3 schema, the seed re-export, and the publish fallback are also listed under Temporary compatibility in `docs/architecture-separation.md`.
