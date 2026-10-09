---
name: Study Room question timing
description: Product behavior for navigating questions in Study Room Per-Question mode.
---

In Per-Question mode, every question the student advances to gets the selected full duration again. The displayed question and timer must advance together.

**Why:** The user repeated the timer-reset requirement after the timer remained tied to the previous question during local navigation.

**How to apply:** Any Per-Question next/jump path must reset the timer for the visible question, or be disabled; do not leave a local question index moving independently from its countdown.
