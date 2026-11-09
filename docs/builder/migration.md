# Draft migration

Version 3 drafts can be converted to a version 1 visual document. Backups are required before a write.

Commands in `package.json`:

- `npm run migrate:dry` reads drafts and writes a report. It does not update draft rows.
- `npm run migrate:execute` writes the conversion.
- `npm run migrate:rollback` restores the newest backup for a draft.

The dry-run comparison notes are `docs/migration/comparison.md` and `docs/migration/dry-run.json`. Unmapped fields are reported. They are not dropped silently.

The latest dry-run in this environment exited 0 and listed no Quantum Age drafts, because this database has none. That result is in `docs/test-report/migration.txt`. It does not replace the earlier dry-run report, which is still in `docs/migration/dry-run.json`.
