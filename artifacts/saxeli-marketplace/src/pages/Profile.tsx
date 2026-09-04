import { useMemo, useState } from 'react';
import { Bookmark, Check, ChevronRight, Inbox, ListPlus, MessageCircle, Settings, Star } from 'lucide-react';
import { Link } from 'wouter';
import { getGetProfileSummaryQueryKey, getListItemsQueryKey, getListMessagesQueryKey, useGetProfileSummary, useListItems, useListMessages } from '@workspace/api-client-react';
import type { MarketplaceItem, MessageThread } from '@workspace/api-client-react';
import { Avatar, ItemVisual, Notice, PageHeader } from '@/components/MarketplaceChrome';

function price(value: number) { return `${value.toLocaleString('ka-GE')} ₾`; }

function ProfileLoading() {
  return <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10"><div className="skeleton h-10 w-44 rounded" /><div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="skeleton h-28 rounded-2xl" /><div className="skeleton h-28 rounded-2xl" /><div className="skeleton h-28 rounded-2xl" /></div><div className="mt-8 skeleton h-72 rounded-2xl" /></div>;
}

export default function Profile() {
  const [tab, setTab] = useState<'listings' | 'saved' | 'messages'>('listings');
  const profileQuery = useGetProfileSummary({ query: { queryKey: getGetProfileSummaryQueryKey() } });
  const itemsQuery = useListItems({ limit: 50 }, { query: { queryKey: getListItemsQueryKey({ limit: 50 }) } });
  const messagesQuery = useListMessages({ query: { queryKey: getListMessagesQueryKey() } });
  const profile = profileQuery.data;
  const items = itemsQuery.data ?? [];
  const savedItems = useMemo(() => items.filter((item) => item.isFavorite), [items]);
  const messages = messagesQuery.data ?? [];
  const loading = profileQuery.isLoading || itemsQuery.isLoading || messagesQuery.isLoading;

  if (loading) return <ProfileLoading />;
  if (profileQuery.isError) return <div className="mx-auto max-w-[760px] px-5 py-16 md:px-10"><Notice tone="error">პროფილის ჩატვირთვა ვერ მოხერხდა. <button type="button" className="ml-1 font-semibold underline" onClick={() => profileQuery.refetch()} data-testid="button-retry-profile">თავიდან ცდა</button></Notice></div>;

  const statCards = [{ label: 'აქტიური განცხადება', value: profile?.activeListings ?? items.length, accent: 'bg-[hsl(var(--primary)/.2)]' }, { label: 'შენახული ნივთი', value: profile?.savedItems ?? savedItems.length, accent: 'bg-[hsl(var(--accent)/.16)]' }, { label: 'წაუკითხავი', value: profile?.unreadMessages ?? messages.reduce((total, message) => total + message.unread, 0), accent: 'bg-[hsl(var(--secondary)/.13)]' }];

  return (
    <div>
      <PageHeader title="ჩემი Saxeli" eyebrow="პირადი სივრცე"><Link href="/sell" className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" data-testid="link-profile-sell"><ListPlus size={16} /> ახალი განცხადება</Link></PageHeader>
      <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10 md:py-10">
        <section className="enter flex flex-col gap-5 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:flex-row sm:items-center sm:p-7"><Avatar initials={profile?.initials ?? 'ს'} size="lg" testId="img-profile-avatar" /><div className="flex-1"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">მოგესალმები</p><h2 className="font-display mt-1 text-3xl font-semibold tracking-[-.05em]" data-testid="text-profile-name">{profile?.name ?? 'Saxeli-ს წევრი'}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]"><Star size={14} className="fill-[hsl(var(--primary))] text-[hsl(var(--primary))]" /> {profile?.rating?.toFixed(1) ?? '—'} შეფასება</p></div><button type="button" className="flex items-center gap-2 self-start rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-xs font-semibold transition hover:border-[hsl(var(--primary))]" onClick={() => setTab('listings')} data-testid="button-profile-settings"><Settings size={15} /> პარამეტრები</button></section>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{statCards.map((stat) => <div key={stat.label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.accent}`}><span className="font-mono-ui text-sm font-bold">{stat.value}</span></span><p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</p></div>)}</div>
        <div className="mt-10 flex gap-1 overflow-x-auto border-b border-[hsl(var(--border))]" role="tablist"><button type="button" onClick={() => setTab('listings')} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'listings' ? 'border-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))]'}`} data-testid="tab-listings">ჩემი განცხადებები</button><button type="button" onClick={() => setTab('saved')} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'saved' ? 'border-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))]'}`} data-testid="tab-saved"><Bookmark size={14} className="mr-2 inline" />შენახული</button><button type="button" onClick={() => setTab('messages')} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'messages' ? 'border-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))]'}`} data-testid="tab-messages"><Inbox size={14} className="mr-2 inline" />შეტყობინებები</button></div>
        {tab === 'messages' ? <MessageList messages={messages} /> : <ListingGrid items={tab === 'saved' ? savedItems : items} emptyCopy={tab === 'saved' ? 'ჯერ არაფერი შეგინახავს.' : 'ჯერ არც ერთი განცხადება არ გაქვს.'} /> }
      </div>
    </div>
  );
}

function ListingGrid({ items, emptyCopy }: { items: MarketplaceItem[]; emptyCopy: string }) {
  return items.length === 0 ? <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] px-6 py-16 text-center"><Bookmark size={23} className="mx-auto text-[hsl(var(--muted-foreground))]" /><h3 className="font-display mt-4 text-xl font-semibold">{emptyCopy}</h3><Link href={emptyCopy.includes('შეინახ') ? '/' : '/sell'} className="btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold" data-testid="link-profile-empty-action">{emptyCopy.includes('შეინახ') ? 'აღმოაჩინე ნივთები' : 'დაამატე პირველი' }<ChevronRight size={15} /></Link></div> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="lift group overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" data-testid={`card-profile-item-${item.id}`}><Link href={`/item/${item.id}`} className="block aspect-[1.5]"><ItemVisual src={item.image} title={item.title} className="h-full w-full" /></Link><div className="p-4"><div className="flex justify-between gap-3"><Link href={`/item/${item.id}`} className="truncate text-sm font-semibold" data-testid={`link-profile-item-${item.id}`}>{item.title}</Link><span className="font-mono-ui text-xs font-bold">{price(item.price)}</span></div><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{item.city} · {item.condition}</p></div></article>)}</div>;
}

function MessageList({ messages }: { messages: MessageThread[] }) {
  return messages.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-[hsl(var(--border))] px-6 py-16 text-center"><MessageCircle size={23} className="mx-auto text-[hsl(var(--muted-foreground))]" /><h3 className="font-display mt-4 text-xl font-semibold">შეტყობინებები ჯერ არ არის</h3><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">როცა ვინმეს შენი ნივთი დააინტერესებს, აქ გამოჩნდება.</p></div> : <div className="mt-6 max-w-3xl space-y-2">{messages.map((message) => <button type="button" key={message.id} className="flex w-full items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left transition hover:border-[hsl(var(--primary)/.6)] hover:shadow-[var(--shadow-xs)]" onClick={() => undefined} data-testid={`button-message-${message.id}`}><Avatar initials={message.initials} size="md" /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{message.name}</span><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">{message.time}</span></span><span className="mt-1 block truncate text-xs text-[hsl(var(--muted-foreground))]">{message.itemTitle} · {message.preview}</span></span>{message.unread > 0 ? <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[hsl(var(--primary))] px-1.5 font-mono-ui text-[10px]">{message.unread}</span> : <Check size={16} className="text-[hsl(var(--accent))]" />}</button>)}</div>;
}