---
name: Category identity
description: Durable identity and filtering rules for Saxeli's hierarchical marketplace taxonomy.
---

Use canonical category slugs as stable identifiers in URLs, listing writes, and API filters. Georgian names are presentation labels and may evolve without changing category identity. Selecting a parent category includes listings assigned anywhere below it.

**Why:** Reusing Georgian labels as identifiers previously caused drift between AI classification, forms, navigation, and exact-match database filters.

**How to apply:** New category-aware features should read the catalog, submit slugs, render Georgian names, and preserve the parent/descendant filtering rule.