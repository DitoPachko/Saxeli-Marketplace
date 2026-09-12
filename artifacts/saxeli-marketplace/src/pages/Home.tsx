import { useMemo, useState } from 'react';
import { Check, ChevronDown, Heart, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getListItemsQueryKey, useListItems, useToggleItemFavorite } from '@workspace/api-client-react';
import type { ListItemsParams, MarketplaceItem } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, ItemVisual, Notice } from '@/components/MarketplaceChrome';
import { useFilters, cities } from '@/hooks/use-filters';
import { useCategoryTree } from '@/hooks/use-categories';
import { useUser } from '@clerk/react';

function formatPrice(price: number) {
  return `${price.toLocaleString('ka-GE')} ₾`;
}

function timeAgo(date: string) {
  const difference = Math.max(0, Date.now() - new Date(date).getTime());
  const hours = Math.floor(difference / 3600000);
  if (hours < 1) return 'ახლახან';
  if (hours < 24) return `${hours} საათის წინ`;
  return `${Math.floor(hours / 24)} დღის წინ`;
}

function ItemCard({ item, favorite, onFavorite }: { item: MarketplaceItem; favorite: boolean; onFavorite: (item: MarketplaceItem) => void }) {
  return (
    <article className="group lift overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" data-testid={`card-item-${item.id}`}>
      <div className="relative aspect-[1.08]">
        <Link href={`/listing/${item.id}`} className="absolute inset-0 z-0" data-testid={`link-item-${item.id}`}>
          <ItemVisual src={item.image} title={item.title} className="h-full w-full" />
        </Link>
        <div className="absolute left-3 top-3 z-10 rounded-full bg-[hsl(var(--card)/.88)] px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-[.12em] backdrop-blur-sm">{item.condition}</div>
        <button type="button" onClick={() => onFavorite(item)} className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition ${favorite ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--card)/.88)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary))]'}`} aria-label={favorite ? 'შენახულებიდან წაშლა' : 'შენახვა'} data-testid={`button-favorite-${item.id}`}>
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/listing/${item.id}`} className="min-w-0" data-testid={`link-item-title-${item.id}`}>
            <h2 className="truncate text-[15px] font-semibold tracking-[-.02em]">{item.title}</h2>
          </Link>
          <span className="shrink-0 font-mono-ui text-sm font-bold">{formatPrice(item.price)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1"><MapPin size={13} />{item.city}</span>
          <span>{timeAgo(item.postedAt)}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-3">
          <Avatar initials={item.seller.initials} size="sm" />
          <span className="truncate text-xs font-medium">{item.seller.name}</span>
          <span className="ml-auto font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">★ {item.seller.rating.toFixed(1)}</span>
        </div>
      </div>
    </article>
  );
}

function ItemSkeleton() {
  return <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="skeleton aspect-[1.08]" /><div className="space-y-3 p-4"><div className="skeleton h-4 w-3/5 rounded" /><div className="skeleton h-3 w-2/5 rounded" /><div className="skeleton h-8 w-full rounded" /></div></div>;
}

export default function Home() {
  const { search, setSearch, submittedSearch, setSubmittedSearch, categorySlug, setCategorySlug, city, setCity } = useFilters();
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState<'date' | 'priceAsc' | 'priceDesc'>('date');
  const queryClient = useQueryClient();
  const { isSignedIn } = useUser();
  const [location, setLocation] = useLocation();
  const { tree, flatMap, isLoading: isCategoriesLoading } = useCategoryTree();

  const params = useMemo<ListItemsParams>(() => ({
    search: submittedSearch || undefined,
    category: categorySlug || undefined,
    city: city === cities[0] ? undefined : city,
    limit: 50,
  }), [submittedSearch, categorySlug, city]);
  
  const { data: items, isLoading: isItemsLoading, isError, refetch } = useListItems(params, { query: { queryKey: getListItemsQueryKey(params) } });
  const toggleFavorite = useToggleItemFavorite();
  const listingItems = items ?? [];
  const sortedItems = useMemo(() => {
    if (sort === 'date') return listingItems;
    return [...listingItems].sort((a, b) =>
      sort === 'priceAsc' ? a.price - b.price : b.price - a.price,
    );
  }, [listingItems, sort]);
  const isLoading = isItemsLoading || isCategoriesLoading;

  const handleFavorite = (item: MarketplaceItem) => {
    if (!isSignedIn) {
      const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
      const returnTo = encodeURIComponent(location + currentSearch);
      setLocation(`/login?returnTo=${returnTo}`);
      return;
    }

    const next = !(favoriteOverrides[item.id] ?? item.isFavorite ?? false);
    setFavoriteOverrides((current) => ({ ...current, [item.id]: next }));
    toggleFavorite.mutate({ id: item.id }, {
      onSuccess: (state) => {
        setFavoriteOverrides((current) => ({ ...current, [state.id]: state.isFavorite }));
        queryClient.setQueryData(getListItemsQueryKey(params), (current: MarketplaceItem[] | undefined) => current?.map((entry) => entry.id === state.id ? { ...entry, isFavorite: state.isFavorite } : entry));
      },
      onError: () => setFavoriteOverrides((current) => ({ ...current, [item.id]: !next })),
    });
  };

  const categoryName = categorySlug ? flatMap.get(categorySlug)?.name || categorySlug : '';
  const displayTitle = submittedSearch || categoryName 
    ? `შედეგები: ${submittedSearch ? `"${submittedSearch}" ` : ''}${categoryName}` 
    : 'ახლახან დამატებული';

  return (
    <div>
      <div className="mx-auto max-w-[1320px] px-5 py-7 md:px-10 md:py-10">
        <section className="enter relative overflow-hidden rounded-[2rem] bg-[hsl(var(--secondary))] px-6 py-8 text-[hsl(var(--secondary-foreground))] md:px-12 md:py-12">
          <div className="relative z-10 max-w-xl">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-[hsl(var(--primary))]">დღის აღმოჩენა</p>
            <h2 className="font-display mt-4 max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-.06em] md:text-6xl">კარგი ნივთები<br /><span className="text-[hsl(var(--primary))]">ახლოსაა.</span></h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[hsl(var(--secondary-foreground)/.7)] md:text-base">იპოვე ის, რაც უკვე უყვარდა სხვას და ახლა შენს ცხოვრებაში ეძებს ადგილს.</p>
          </div>
          <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full border-[34px] border-[hsl(var(--primary)/.95)] md:h-[30rem] md:w-[30rem]" aria-hidden="true" />
          <div className="absolute -bottom-32 right-20 h-72 w-72 rounded-full border border-[hsl(var(--accent)/.45)] md:h-96 md:w-96" aria-hidden="true" />
          <span className="absolute bottom-6 right-8 hidden font-display text-7xl text-[hsl(var(--secondary-foreground)/.08)] md:block">ს.</span>
        </section>

        <section className="enter enter-delay-1 mt-8 space-y-4" aria-label="ძიება და კატეგორიები">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedSearch(search.trim());
            }}
            className="flex w-full items-center overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition focus-within:border-[hsl(var(--primary))] focus-within:shadow-[var(--shadow-sm)]"
          >
            <Search size={19} className="ml-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                setSubmittedSearch(value.trim());
              }}
              placeholder="ძებნა..."
              aria-label="ძებნა"
              className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              data-testid="input-feed-search"
            />
            <button
              type="submit"
              className="mr-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))] transition hover:opacity-90"
              data-testid="button-feed-search"
            >
              ძებნა
            </button>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="კატეგორიები">
            <button
              type="button"
              onClick={() => setCategorySlug('')}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                !categorySlug
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/.6)]'
              }`}
              data-testid="button-category-all"
            >
              ყველა
            </button>
            {tree.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => setCategorySlug(categorySlug === category.slug ? '' : category.slug)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  categorySlug === category.slug
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/.6)]'
                }`}
                data-testid={`button-category-${category.slug}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="enter enter-delay-1 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="ფილტრები">
          <div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={17} /> ლოკაცია</div>
          <div className="grid w-full gap-2 sm:flex sm:w-auto">
            <label className="relative block w-full sm:w-64">
              <span className="sr-only">ქალაქი</span>
              <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full cursor-pointer appearance-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="select-city">
                {cities.map((option) => <option key={option}>{option}</option>)}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-4 top-3.5 text-[hsl(var(--muted-foreground))]" />
            </label>
            <label className="relative block w-full sm:w-64">
              <span className="sr-only">დალაგება</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as 'date' | 'priceAsc' | 'priceDesc')}
                className="w-full cursor-pointer appearance-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[hsl(var(--primary))]"
                data-testid="select-feed-sort"
              >
                <option value="date">თარიღით</option>
                <option value="priceAsc">ფასი: დაბლიდან მაღლა</option>
                <option value="priceDesc">ფასი: მაღლიდან დაბლა</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-4 top-3.5 text-[hsl(var(--muted-foreground))]" />
            </label>
          </div>
        </section>

        <div className="mt-10 flex items-end justify-between border-b border-[hsl(var(--border))] pb-4">
          <div>
            <h2 className="font-display mt-1 text-2xl font-semibold tracking-[-.04em] md:text-3xl">
              {displayTitle}
            </h2>
          </div>
          <span className="hidden text-xs text-[hsl(var(--muted-foreground))] sm:block" data-testid="text-results-count">{listingItems.length} განცხადება</span>
        </div>
        
        {isError ? <div className="mt-6"><Notice tone="error">ნივთების ჩატვირთვა ვერ მოხერხდა. <button type="button" className="ml-1 font-semibold underline" onClick={() => refetch()} data-testid="button-retry-items">თავიდან ცდა</button></Notice></div> : null}
        
        {isLoading ? <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[1, 2, 3, 4].map((id) => <ItemSkeleton key={id} />)}</div> : null}
        
        {!isLoading && !isError && listingItems.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/.22)]"><Search size={22} /></div>
            <h3 className="font-display mt-4 text-xl font-semibold">ამ ძიებამ არაფერი იპოვა</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">სცადე სხვა სიტყვა ან გააფართოვე ფილტრი.</p>
            <button type="button" className="btn-ink mt-5 rounded-lg px-4 py-2 text-sm font-medium" onClick={() => { setSearch(''); setSubmittedSearch(''); setCategorySlug(''); setCity(cities[0]); }} data-testid="button-reset-filters">ფილტრების გასუფთავება</button>
          </div>
        ) : null}
        
        {!isLoading && !isError && sortedItems.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedItems.map((item, index) => (
              <div key={item.id} className={`enter enter-delay-${Math.min(index + 1, 3)}`}>
                <ItemCard item={item} favorite={favoriteOverrides[item.id] ?? item.isFavorite ?? false} onFavorite={handleFavorite} />
              </div>
            ))}
          </div>
        ) : null}
        
        <section className="mt-14 grid gap-5 border-t border-[hsl(var(--border))] pt-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Saxeli-ს პრინციპი</p>
            <h2 className="font-display mt-2 max-w-2xl text-3xl font-semibold leading-tight tracking-[-.05em] md:text-4xl">ყიდვა-გაყიდვა, როგორც საუბარი მეზობელთან.</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--accent)/.2)]"><Check size={17} /></span> ადამიანებისგან, ადამიანებისთვის
          </div>
        </section>
      </div>
    </div>
  );
}
