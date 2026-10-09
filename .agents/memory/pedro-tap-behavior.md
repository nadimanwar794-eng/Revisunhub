---
name: Pedro tap behavior
description: Pedro mascot single-tap and double-tap interaction contract.
---

A single tap on Pedro performs its normal open action. A separate second tap hides Pedro; one physical tap must never be interpreted as both the pointer interaction and a second click.

**Why:** The user reported Pedro hiding after one tap because pointer-up and click fallback handling counted the same interaction twice.

**How to apply:** Keep Pedro gesture detection on one input event path. If adding mouse or touch fallbacks, ensure they do not double-count events already handled by pointer events.
