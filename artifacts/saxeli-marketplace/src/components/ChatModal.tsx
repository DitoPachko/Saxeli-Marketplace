import { FormEvent, useEffect, useRef, useState } from "react";
import { LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import {
  createListingConversation,
  getConversationEventsUrl,
  getListConversationMessagesQueryKey,
  useListConversationMessages,
  useSendConversationMessage,
} from "@workspace/api-client-react";
import type { MarketplaceItem, Message } from "@workspace/api-client-react";
import { Avatar } from "@/components/MarketplaceChrome";

type CurrentUser = { id: string } | null | undefined;
type ChatMessage = Omit<Message, "createdAt"> & { createdAt: Date };

export function ChatModal({
  item,
  currentUser,
  onClose,
  existingConversationId,
}: {
  item: Pick<MarketplaceItem, "id" | "title" | "seller">;
  currentUser: CurrentUser;
  onClose: () => void;
  existingConversationId?: string;
}) {
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [setupError, setSetupError] = useState("");
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef(new Set<string>());
  const appendMessage = (message: ChatMessage) => {
    setMessages((current) => {
      if (knownIds.current.has(message.id)) return current;
      knownIds.current.add(message.id);
      return [...current, message].sort((a, b) => {
        const byTime = a.createdAt.getTime() - b.createdAt.getTime();
        return byTime || a.id.localeCompare(b.id);
      });
    });
  };

  useEffect(() => {
    let cancelled = false;
    setSetupError("");
    setConversationId("");
    setMessages([]);
    knownIds.current.clear();
    if (existingConversationId) {
      setConversationId(existingConversationId);
    } else {
      createListingConversation(item.id)
        .then((conversation) => {
          if (!cancelled) setConversationId(conversation.id);
        })
        .catch(() => {
          if (!cancelled) setSetupError("საუბრის გახსნა ვერ მოხერხდა. სცადეთ თავიდან.");
        });
    }
    return () => {
      cancelled = true;
    };
  }, [item.id, existingConversationId]);

  const history = useListConversationMessages(conversationId, {
    query: { queryKey: getListConversationMessagesQueryKey(conversationId), enabled: Boolean(conversationId), staleTime: 0 },
  });
  const send = useSendConversationMessage();

  useEffect(() => {
    if (!history.data) return;
    setMessages((current) => {
      const merged = [...current];
      for (const message of history.data) {
        if (!knownIds.current.has(message.id)) {
          knownIds.current.add(message.id);
          merged.push({ ...message, createdAt: new Date(message.createdAt) });
        }
      }
      return merged.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    });
  }, [history.data]);

  useEffect(() => {
    if (!conversationId) return;
    const events = new EventSource(getConversationEventsUrl(conversationId));
    const recoverHistory = () => {
      void history.refetch();
    };
    events.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as Omit<Message, "createdAt"> & { createdAt: string };
        appendMessage({ ...parsed, createdAt: new Date(parsed.createdAt) });
      } catch {
        // A malformed event is ignored; the next reconnect/history fetch repairs it.
      }
    });
    events.addEventListener("open", recoverHistory);
    return () => events.close();
  }, [conversationId, history.refetch]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!conversationId || !trimmed || send.isPending) return;
    setSendError("");
    send.mutate(
      { conversationId, data: { text: trimmed } },
      {
        onSuccess: (message) => {
          appendMessage({ ...message, createdAt: new Date(message.createdAt) });
          setText("");
        },
        onError: () => setSendError("შეტყობინება ვერ გაიგზავნა. სცადეთ თავიდან."),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--secondary)/.48)] p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="flex max-h-[min(720px,calc(100vh-1.5rem))] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-xl)]" role="dialog" aria-modal="true" aria-label="გამყიდველთან ჩატი">
        <header className="flex items-center gap-3 border-b border-[hsl(var(--border))] p-4">
          <Avatar initials={item.seller.initials} src={item.seller.avatarUrl ?? undefined} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{currentUser?.id === item.seller.id ? "მყიდველთან საუბარი" : `მიწერე ${item.seller.name}-ს`}</p>
            <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{item.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[hsl(var(--muted))]" aria-label="დახურვა">
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[hsl(var(--muted)/.32)] p-4">
          {setupError ? <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700">{setupError}</p> : null}
          {!setupError && (history.isLoading || !conversationId) ? (
            <div className="flex items-center justify-center py-12 text-sm text-[hsl(var(--muted-foreground))]"><LoaderCircle className="mr-2 animate-spin" size={17} /> იტვირთება...</div>
          ) : null}
          {!setupError && conversationId && !history.isLoading && messages.length === 0 ? (
            <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]"><MessageCircle className="mx-auto mb-3" size={25} />დაიწყე საუბარი</div>
          ) : null}
          <div className="space-y-2">
            {messages.map((message) => {
              const mine = message.senderId === currentUser?.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "rounded-br-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "rounded-bl-md bg-[hsl(var(--card))] text-[hsl(var(--foreground))]"}`}>
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    <time className="mt-1 block text-[10px] opacity-60">{message.createdAt.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}</time>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="border-t border-[hsl(var(--border))] p-3">
          {sendError ? <p className="mb-2 text-xs text-red-700">{sendError}</p> : null}
          <div className="flex items-end gap-2">
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={2} maxLength={2000} disabled={!conversationId || send.isPending} placeholder="დაწერე შეტყობინება..." className="min-h-11 flex-1 resize-none rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] disabled:opacity-60" />
            <button type="submit" disabled={!conversationId || !text.trim() || send.isPending} className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-50" aria-label="გაგზავნა">
              {send.isPending ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}