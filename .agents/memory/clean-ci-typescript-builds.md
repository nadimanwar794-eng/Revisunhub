---
name: Clean CI TypeScript builds
description: Prevent missing declaration output errors when CI has tracked TypeScript build metadata but no generated library outputs.
---

Keep `tsc --build --force` ahead of workspace leaf typechecks unless tracked `*.tsbuildinfo` files are removed and clean CI is guaranteed to emit ignored library `dist` outputs.

**Why:** A clean Vercel checkout skipped library emission based on tracked build metadata, then API Server typechecking failed with TS6305 because ignored declaration output files were absent.

**How to apply:** When a clean workspace reports TS6305 for a referenced library, inspect both tracked build-info files and ignored output directories; ensure the library build emits outputs before leaf typechecks.
