import { Router, type IRouter, type Response } from "express";
import { and, asc, desc, eq, or } from "drizzle-orm";
import {
  CreateListingConversationParams,
  CreateListingConversationResponse,
  ConversationEventsParams,
  GetListingConversationParams,
  GetListingConversationResponse,
  ListConversationMessagesParams,
  ListConversationMessagesResponse,
  ListMessagesResponse,
  SendConversationMessageBody,
  SendConversationMessageParams,
  SendConversationMessageResponse,
} from "@workspace/api-zod";
import { conversations, db, listings, messages } from "@workspace/db";
import { getCurrentUser } from "../lib/currentUser";

const router: IRouter = Router();
const subscribers = new Map<string, Set<Response>>();

function conversationParticipants(conversation: {
  buyerId: string;
  sellerId: string;
}, userId: string) {
  return conversation.buyerId === userId || conversation.sellerId === userId;
}

function publishMessage(message: typeof messages.$inferSelect) {
  const clients = subscribers.get(message.conversationId);
  if (!clients) return;
  const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
  for (const client of clients) {
    if (!client.writableEnded) client.write(payload);
  }
}

async function findConversationForParticipant(id: string, userId: string) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conversation) return { conversation: undefined, authorized: false };
  return { conversation, authorized: conversationParticipants(conversation, userId) };
}

router.get("/messages", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  const rows = await db
    .select({ conversation: conversations, listingTitle: listings.title, listingImage: listings.image })
    .from(conversations)
    .innerJoin(listings, eq(conversations.listingId, listings.id))
    .where(or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id)))
    .orderBy(desc(conversations.updatedAt));
  res.json(ListMessagesResponse.parse(rows.map(({ conversation, listingTitle, listingImage }) => ({ ...conversation, listingTitle, listingImage }))));
});

router.get("/listings/:listingId/conversation", async (req, res): Promise<void> => {
  const params = GetListingConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "განცხადების იდენტიფიკატორი არასწორია" });
    return;
  }
  const user = await getCurrentUser(req);
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.listingId, params.data.listingId), eq(conversations.buyerId, user.id)));
  if (!conversation) {
    res.status(404).json({ error: "საუბარი ვერ მოიძებნა" });
    return;
  }
  res.json(GetListingConversationResponse.parse(conversation));
});

router.post("/listings/:listingId/conversation", async (req, res): Promise<void> => {
  const params = CreateListingConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "განცხადების იდენტიფიკატორი არასწორია" });
    return;
  }
  const user = await getCurrentUser(req);
  const [listing] = await db
    .select({ id: listings.id, sellerId: listings.userId })
    .from(listings)
    .where(eq(listings.id, params.data.listingId));
  if (!listing) {
    res.status(404).json({ error: "განცხადება ვერ მოიძებნა" });
    return;
  }
  if (listing.sellerId === user.id) {
    res.status(403).json({ error: "საკუთარ განცხადებაზე შეტყობინების გაგზავნა შეუძლებელია" });
    return;
  }

  // The unique listing+buyer index makes this safe when multiple tabs create
  // the first conversation concurrently.
  await db
    .insert(conversations)
    .values({ listingId: listing.id, buyerId: user.id, sellerId: listing.sellerId })
    .onConflictDoNothing({ target: [conversations.listingId, conversations.buyerId] });
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.listingId, listing.id), eq(conversations.buyerId, user.id)));
  if (!conversation) {
    res.status(500).json({ error: "საუბრის შექმნა ვერ მოხერხდა" });
    return;
  }
  res.status(201).json(CreateListingConversationResponse.parse(conversation));
});

router.get("/conversations/:conversationId/messages", async (req, res): Promise<void> => {
  const params = ListConversationMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "საუბრის იდენტიფიკატორი არასწორია" });
    return;
  }
  const user = await getCurrentUser(req);
  const { conversation, authorized } = await findConversationForParticipant(params.data.conversationId, user.id);
  if (!conversation) {
    res.status(404).json({ error: "საუბარი ვერ მოიძებნა" });
    return;
  }
  if (!authorized) {
    res.status(403).json({ error: "ამ საუბრის ნახვის უფლება არ გაქვთ" });
    return;
  }
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(asc(messages.createdAt), asc(messages.id));
  res.json(ListConversationMessagesResponse.parse(history));
});

router.post("/conversations/:conversationId/messages", async (req, res): Promise<void> => {
  const params = SendConversationMessageParams.safeParse(req.params);
  const body = SendConversationMessageBody.safeParse(req.body);
  if (!params.success || !body.success || !body.data.text.trim()) {
    res.status(400).json({ error: "შეტყობინება ცარიელი ან ზედმეტად გრძელია" });
    return;
  }
  const user = await getCurrentUser(req);
  const { conversation, authorized } = await findConversationForParticipant(params.data.conversationId, user.id);
  if (!conversation) {
    res.status(404).json({ error: "საუბარი ვერ მოიძებნა" });
    return;
  }
  if (!authorized) {
    res.status(403).json({ error: "ამ საუბარში შეტყობინების გაგზავნის უფლება არ გაქვთ" });
    return;
  }
  const text = body.data.text.trim();
  const [message] = await db
    .insert(messages)
    .values({ conversationId: conversation.id, senderId: user.id, text })
    .returning();
  await db
    .update(conversations)
    .set({ updatedAt: message.createdAt })
    .where(eq(conversations.id, conversation.id));
  // Broadcast only after both writes succeed, so clients can always recover
  // from the durable history if their SSE connection drops.
  publishMessage(message);
  res.status(201).json(SendConversationMessageResponse.parse(message));
});

router.get("/conversations/:conversationId/events", async (req, res): Promise<void> => {
  const params = ConversationEventsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "საუბრის იდენტიფიკატორი არასწორია" });
    return;
  }
  const user = await getCurrentUser(req);
  const { conversation, authorized } = await findConversationForParticipant(params.data.conversationId, user.id);
  if (!conversation) {
    res.status(404).json({ error: "საუბარი ვერ მოიძებნა" });
    return;
  }
  if (!authorized) {
    res.status(403).json({ error: "ამ საუბრის მოვლენებზე წვდომის უფლება არ გაქვთ" });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write("retry: 3000\n\n");

  const clients = subscribers.get(conversation.id) ?? new Set<Response>();
  clients.add(res);
  subscribers.set(conversation.id, clients);
  const keepAlive = setInterval(() => {
    if (!res.writableEnded) res.write(": keep-alive\n\n");
  }, 25_000);
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearInterval(keepAlive);
    clients.delete(res);
    if (clients.size === 0) subscribers.delete(conversation.id);
  };
  req.on("close", cleanup);
  res.on("close", cleanup);
});

export default router;