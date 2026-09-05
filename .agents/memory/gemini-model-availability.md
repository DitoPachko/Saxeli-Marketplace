---
name: Gemini model availability
description: Direct Gemini API model compatibility observed for this project's account.
---

Use Gemini 3.6 Flash for direct image analysis requests in this project; Gemini 2.5 Flash is unavailable to this API account.

**Why:** Google returned a model-retirement error for Gemini 2.5 Flash and explicitly directed new users to Gemini 3.6 Flash. The same Base64 image request succeeded after changing only the model.

**How to apply:** If changing the Gemini model, verify availability with a live image request before assuming older stable model names still work.