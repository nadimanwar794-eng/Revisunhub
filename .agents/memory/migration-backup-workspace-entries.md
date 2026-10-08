---
name: Migration backup workspace entries
description: Avoid duplicate package execution when a migrated app is copied out of its backup directory.
---

Do not include an imported package under `.migration-backup/` in the active pnpm workspace after copying it into `artifacts/`.

**Why:** pnpm can match both same-named packages for a filtered run, launching two dev servers on the same artifact port.

**How to apply:** Inspect `pnpm-workspace.yaml` after migration and remove any explicit backup package path once its active artifact has been created.
