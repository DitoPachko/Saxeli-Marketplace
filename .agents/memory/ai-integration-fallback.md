---
name: AI integration fallback
description: How to keep AI-assisted features usable when Replit AI credits are unavailable.
---

If Replit AI integration setup is blocked by account limits, use the securely stored provider key only after the user supplies it through the secrets flow, and keep the provider call server-side.

**Why:** The built-in integration may require an account upgrade even when the feature itself is valid; a direct provider fallback preserves the user choice without exposing credentials in the browser.

**How to apply:** Do not retry the blocked setup. Request the provider key securely, keep it out of logs and client bundles, and provide a manual fallback when AI analysis fails.