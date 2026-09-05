---
name: AI provider policy
description: Security and failure behavior for direct AI provider access.
---

Use securely stored provider keys only after the user supplies them through the secrets flow, and keep all provider calls server-side. Visual recognition failures must not populate mock listing details.

**Why:** The user requires listing fields to come from the uploaded image rather than filenames, fixed guesses, or generic fallback content.

**How to apply:** Keep keys out of logs, client bundles, and project files. Return an explicit analysis error when the provider fails, leaving the user free to enter details manually.