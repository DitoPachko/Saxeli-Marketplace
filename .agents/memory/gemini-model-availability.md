---
name: Gemini model availability
description: Direct Gemini API model compatibility observed for this project's account.
---

Use Gemini 3.6 Flash for direct image analysis requests in this project; Gemini 2.5 Flash is unavailable to this API account.

Production calls to Gemini 3.6 Flash must retry temporary `429` and `5xx` responses with bounded backoff.

**Why:** Google returned a model-retirement error for Gemini 2.5 Flash and explicitly directed new users to Gemini 3.6 Flash. In production, valid authenticated requests intermittently returned `503 UNAVAILABLE` during demand spikes even though the same request succeeded in development.

**How to apply:** If changing the Gemini model, verify availability with a live image request before assuming older stable model names still work. Retry only network failures, rate limits, and temporary server errors; fail fast for permanent client errors.