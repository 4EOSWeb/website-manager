# Rollback

`npm run migrate:rollback` runs `scripts/restore-draft-backup.ts`. It restores a draft from `draft_backups`. It does not roll back a public deploy.

The baseline tag is `baseline-editor-chrome-eb8a` at `2eb0a96ce5b6b7f602a69962035d22c95a6f792c`. Checking that tag out shows the baseline tree. A hard reset to the tag drops later commits. Prefer `git revert` when the later commits should stay in history.

This document does not run a rollback.
