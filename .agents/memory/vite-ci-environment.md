---
name: Vite CI environment
description: Keep static Vite builds independent of runtime variables injected only by Replit workflows.
---

Vite configurations used by the root workspace build must allow `vite build` without `PORT` or `BASE_PATH`; use safe defaults when those variables are absent and keep honoring injected values for Replit workflows.

**Why:** Vercel runs the root `pnpm run build` without Replit's runtime environment, so requiring workflow-only values prevented the workspace build from reaching completion.

**How to apply:** When an artifact participates in root CI builds, check its Vite config for top-level environment validation and keep server-only configuration optional during production builds.

Managed Replit artifact dev commands must also avoid a hardcoded `--port` that overrides the injected `PORT`; let Vite read it from the config and keep `strictPort` enabled.

**Why:** The workflow waits on its configured artifact port, so Vite can appear healthy on another port while the workflow times out.

**How to apply:** Keep artifact dev scripts host-focused and use the workflow-provided port in Vite config instead of pinning a port in the command.
