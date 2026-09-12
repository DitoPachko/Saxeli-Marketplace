import { useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";
import { useUser } from "@clerk/react";
import { getListMessagesQueryKey, useListMessages } from "@workspace/api-client-react";
import type { Conversation } from "@workspace/api-client-react";
import { ChatModal } from "@/components/ChatModal";
import { Avatar, Notice, PageHeader } from "@/components/MarketplaceChrome";

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "მ";
}

export default function Messages() {
  const { isLoaded, user } = useUser();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const conversations = useListMessages({
    query: {
      queryKey: getListMessagesQueryKey(),
      enabled: isLoaded && Boolean(user),
    },
  });

  const loading = !isLoaded || conversations.isLoading;
  const openConversation = (conversation: Conversation) => setActiveConversation(conversation);

  return (
    <div>
      <PageHeader title="შეტყობინებები" eyebrow="პირადი სივრცე" />
      <div className="mx-auto max-w-[920px] px-5 py-8 md:px-10 md:py-10">
        {loading ? (
          <div className="space-y-3" aria-label="შეტყობინებები იტვირთება">
            {[1, 2, 3].map((id) => <div key={id} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : null}

        {!loading && conversations.isError ? (
          <Notice tone="error">
            შეტყობინებების ჩატვირთვა ვერ მოხერხდა.{" "}
            <button type="button" className="inline-flex items-center gap-1 font-semibold underline" onClick={() => void conversations.refetch()}>
              <RefreshCw size={14} /> თავიდან ცდა
            </button>
          </Notice>
        ) : null}

        {!loading && !conversations.isError && conversations.data?.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-16 text-center">
            <MessageCircle className="mx-auto text-[hsl(var(--muted-foreground))]" size={34} />
            <h2 className="font-display mt-4 text-2xl font-semibold">ჯერ შეტყობინებები არ გაქვს</h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">დაინტერესდი ნივთით და მიწერე გამყიდველს.</p>
          </div>
        ) : null}

        {!loading && !conversations.isError && conversations.data?.length ? (
          <div className="space-y-3">
            {conversations.data.map((conversation) => {
              const sellerView = user?.id === conversation.sellerId;
              const otherPartyLabel = sellerView ? "მყიდველთან საუბარი" : "გამყიდველთან საუბარი";
              const listingTitle = conversation.listingTitle ?? `განცხადება #${conversation.listingId.slice(0, 8)}`;
              const seller = {
                id: conversation.sellerId,
                name: sellerView ? "მყიდველი" : "გამყიდველი",
                initials: sellerView ? "მ" : "გ",
                rating: 0,
                listings: 0,
                avatarUrl: null,
                city: null,
                phoneNumber: null,
              };
              return (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => openConversation(conversation)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left transition hover:border-[hsl(var(--primary)/.6)] hover:shadow-[var(--shadow-sm)]"
                >
                  <Avatar initials={seller.initials} src={conversation.listingImage ?? undefined} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-[hsl(var(--muted-foreground))]">{otherPartyLabel}</span>
                    <span className="mt-1 block truncate font-semibold">{listingTitle}</span>
                    <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">საუბარი აქტიურია</span>
                  </span>
                  <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(conversation.updatedAt).toLocaleDateString("ka-GE")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {activeConversation ? (
        <ChatModal
          item={{
            id: activeConversation.listingId,
            title: activeConversation.listingTitle ?? `განცხადება #${activeConversation.listingId.slice(0, 8)}`,
            seller: {
              id: activeConversation.sellerId,
              name: user?.id === activeConversation.sellerId ? "მყიდველი" : "გამყიდველი",
              initials: user?.id === activeConversation.sellerId ? "მ" : "გ",
              rating: 0,
              listings: 0,
              avatarUrl: null,
              city: null,
              phoneNumber: null,
            },
          }}
          currentUser={user}
          existingConversationId={activeConversation.id}
          onClose={() => setActiveConversation(null)}
        />
      ) : null}
    </div>
  );
}