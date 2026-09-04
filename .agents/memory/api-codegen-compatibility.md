---
name: API codegen compatibility
description: OpenAPI numeric types need to match the workspace's Zod generator version.
---

When adding integer-like fields to OpenAPI schemas, prefer `number` unless the generated Zod version is known to support `z.int()`.

**Why:** The installed generator emitted `z.int()` for OpenAPI `integer`, but the workspace resolves Zod 3, which has no `z.int()` export; codegen's chained typecheck then fails.

**How to apply:** After changing the API spec, run codegen and the chained library typecheck before wiring routes or frontend hooks.