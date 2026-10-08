---
name: Vite CI environment
description: Keep static Vite builds independent of runtime variables injected only by Replit workflows.
---

Vite configurations used by the root workspace build must allow `vite build` without `PORT` or `BASE_PATH`; use safe defaults when those variables are absent and keep honoring injected values for Replit workflows.

**Why:** Vercel runs the root `pnpm run build` without Replit's runtime environment, so requiring workflow-only values prevented the workspace build from reaching completion.

**How to apply:** When an artifact participates in root CI builds, check its Vite config for top-level environment validation and keep server-only configuration optional during production builds.
