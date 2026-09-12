import { useState } from "react";
import { Heart, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListFavoriteItemsQueryKey,
  getListItemsQueryKey,
  useListFavoriteItems,
  useToggleItemFavorite,
} from "@workspace/api-client-react";
import type { MarketplaceItem } from "@workspace/api-client-react";
import { Avatar, ItemVisual, Notice, PageHeader } from "@/components/MarketplaceChrome";

function price(value: number) {
  return `${value.toLocaleString("ka-GE")} ₾`;
}

function SavedCard({ item, onRemove }: { item: MarketplaceItem; onRemove: (item: MarketplaceItem) => void }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="relative aspect-[1.08]">
        <Link href={`/listing/${item.id}`} className="absolute inset-0">
          <ItemVisual src={item.image} title={item.title} className="h-full w-full" />
        </Link>
        <button
          type="button"
          onClick={() => onRemove(item)}
          aria-label="შენახულებიდან წაშლა"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm transition hover:scale-105"
        >
          <Heart size={17} fill="currentColor" strokeWidth={1.8} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
        <Link href={`/listing/${item.id}`} className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold">{item.title}</h2>
          </Link>
          <span className="shrink-0 font-mono-ui text-sm font-bold">{price(item.price)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1"><MapPin size={13} />{item.city}</span>
          <span>{item.postedAt}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-3">
          <Avatar initials={item.seller.initials} size="sm" />
          <span className="truncate text-xs font-medium">{item.seller.name}</span>
        </div>
      </div>
    </article>
  );
}

export default function Saved() {
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { data: items = [], isLoading, isError, refetch } = useListFavoriteItems({
    query: { queryKey: getListFavoriteItemsQueryKey() },
  });
  const toggleFavorite = useToggleItemFavorite();

  const removeFavorite = (item: MarketplaceItem) => {
    setRemovingId(item.id);
    toggleFavorite.mutate(
      { id: item.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFavoriteItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          setRemovingId(null);
        },
        onError: () => setRemovingId(null),
      },
    );
  };

  return (
    <div>
      <PageHeader title="შენახულები" eyebrow="შენი არჩევანი" />
      <div className="mx-auto max-w-[1320px] px-5 py-8 md:px-10 md:py-10">
        {isError ? (
          <Notice tone="error">
            შენახული ნივთების ჩატვირთვა ვერ მოხერხდა.
            <button type="button" className="ml-2 font-semibold underline" onClick={() => refetch()}>თავიდან ცდა</button>
          </Notice>
        ) : null}

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((id) => <div key={id} className="skeleton aspect-[1.08] rounded-2xl" />)}
          </div>
        ) : null}

        {!isLoading && !isError && items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-16 text-center">
            <Heart size={32} className="mx-auto text-[hsl(var(--muted-foreground))]" />
            <h2 className="font-display mt-4 text-xl font-semibold">ჯერ არაფერი შეგინახავს</h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">დააჭირე გულის ღილაკს ნებისმიერ ნივთზე, რომ აქ შეინახო.</p>
            <Link href="/" className="btn-primary mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold">ნივთების დათვალიერება</Link>
          </div>
        ) : null}

        {!isLoading && !isError && items.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className={removingId === item.id ? "opacity-50 transition-opacity" : ""}>
                <SavedCard item={item} onRemove={removeFavorite} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}