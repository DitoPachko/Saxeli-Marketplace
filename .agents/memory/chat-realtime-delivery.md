---
name: Chat realtime delivery
description: The delivery guarantees and scaling boundary of Saxeli's real-time marketplace chat.
---

Chat messages are durable in PostgreSQL. Connected clients receive immediate inserts through authenticated Server-Sent Events and refetch history whenever the stream reconnects.

**Why:** This gives the current single API process real-time delivery without adding another managed service, while history recovery prevents dropped streams from losing messages.

**How to apply:** Keep every message write durable before broadcasting. If the API is scaled to multiple simultaneous processes, add shared pub/sub so inserts reach SSE subscribers connected to other processes; retain reconnect history recovery as the correctness fallback.