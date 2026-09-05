---
name: Clerk password ownership
description: Security boundary between Clerk authentication and the application user profile table.
---

Application user records may include a nullable password-hash compatibility field, but the application must never populate it for either email/password or OAuth accounts. Clerk is the sole password and credential authority.

**Why:** Copying, recreating, or independently hashing passwords would split authentication authority and weaken the managed Clerk security model. Clerk does not expose user passwords or password hashes.

**How to apply:** Synchronize identity fields such as user ID, email, display name, and avatar from Clerk. Store marketplace-specific profile fields locally, while leaving the password-hash field null.