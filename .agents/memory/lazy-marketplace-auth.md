---
name: Lazy marketplace authentication
description: Product rule for which Saxeli routes remain public and how gated actions enter authentication.
---

Saxeli uses lazy authentication: home browsing, search, filters, item details, seller profiles, and information pages remain public. Posting, profile management, saved items, and listing editing require a signed-in account.

**Why:** Visitors should understand and explore the marketplace before being asked to create an account.

**How to apply:** Route gated actions through `/login?returnTo=<encoded destination>` and preserve that destination through sign-in and registration so users resume the action they intended.