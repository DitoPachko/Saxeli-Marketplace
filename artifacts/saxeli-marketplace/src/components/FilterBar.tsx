import type { FormEvent } from 'react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { cities, useFilters } from '@/hooks/use-filters';
import type { CategoryNode } from '@/hooks/use-categories';

type FeedSort = 'date' | 'priceAsc' | 'priceDesc';

type FilterBarProps = {
  categories: CategoryNode[];
  sort: FeedSort;
  onSortChange: (sort: FeedSort) => void;
};

const fieldClass =
  'min-h-14 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-base outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.15)]';

export function FilterBar({ categories, sort, onSortChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    search,
    setSearch,
    submittedSearch,
    setSubmittedSearch,
    categorySlug,
    setCategorySlug,
    city,
    setCity,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    clearFilters,
  } = useFilters();

  const activeFilterCount = [
    Boolean(submittedSearch),
    Boolean(categorySlug),
    city !== cities[0],
    Boolean(minPrice || maxPrice),
    sort !== 'date',
  ].filter(Boolean).length;

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setSubmittedSearch(search.trim());
    setIsOpen(false);
  };

  const resetFilters = () => {
    clearFilters();
    onSortChange('date');
  };

  return (
    <div className="enter enter-delay-1 mt-7 flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-5">
      <div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">დააზუსტე შედეგები</p>
        <p className="mt-1 text-sm font-medium">{activeFilterCount ? `${activeFilterCount} აქტიური ფილტრი` : 'ყველა განცხადება'}</p>
      </div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="relative flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-5 text-sm font-bold text-[hsl(var(--secondary-foreground))] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            data-testid="button-open-filters"
          >
            <SlidersHorizontal size={17} />
            ფილტრები
            {activeFilterCount ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] px-1.5 font-mono-ui text-[10px] text-[hsl(var(--primary-foreground))]">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-[hsl(var(--secondary)/.55)] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
          <Dialog.Content
            className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[94dvh] flex-col overflow-hidden rounded-t-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[min(88dvh,760px)] sm:w-[min(680px,calc(100%-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]"
            aria-describedby="filter-dialog-description"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4 sm:px-7">
              <div>
                <Dialog.Title className="font-display text-xl font-semibold tracking-[-.03em]">დეტალური ფილტრი</Dialog.Title>
                <Dialog.Description id="filter-dialog-description" className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  იპოვე ზუსტად ის, რასაც ეძებ
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--muted))] transition hover:bg-[hsl(var(--border))]" aria-label="ფილტრების დახურვა">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </header>

            <form onSubmit={applyFilters} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
                <div>
                  <label htmlFor="filter-search" className="mb-2 block text-sm font-semibold">საძიებო სიტყვა</label>
                  <div className="relative">
                    <input
                      id="filter-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="რას ეძებ?"
                      className={`${fieldClass} pl-11`}
                      data-testid="input-filter-search"
                    />
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">კატეგორია</label>
                  <div className="relative">
                    <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} className={`${fieldClass} cursor-pointer appearance-none pr-11`} data-testid="select-filter-category">
                      <option value="">ყველა კატეგორია</option>
                      {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">ფასი</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <label>
                      <span className="sr-only">მინიმალური ფასი</span>
                      <input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="მინ. ფასი" className={fieldClass} data-testid="input-min-price" />
                    </label>
                    <span className="text-[hsl(var(--muted-foreground))]">—</span>
                    <label>
                      <span className="sr-only">მაქსიმალური ფასი</span>
                      <input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="მაქს. ფასი" className={fieldClass} data-testid="input-max-price" />
                    </label>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">ლოკაცია</label>
                    <div className="relative">
                      <select value={city} onChange={(event) => setCity(event.target.value)} className={`${fieldClass} cursor-pointer appearance-none pr-11`} data-testid="select-city">
                        {cities.map((option) => <option key={option}>{option}</option>)}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">დალაგება</label>
                    <div className="relative">
                      <select value={sort} onChange={(event) => onSortChange(event.target.value as FeedSort)} className={`${fieldClass} cursor-pointer appearance-none pr-11`} data-testid="select-feed-sort">
                        <option value="date">ახალი დამატებული</option>
                        <option value="priceAsc">ფასი: დაბლიდან მაღლა</option>
                        <option value="priceDesc">ფასი: მაღლიდან დაბლა</option>
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                    </div>
                  </div>
                </div>
              </div>

              <footer className="flex shrink-0 items-center gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 sm:px-7">
                <button type="button" onClick={resetFilters} disabled={!activeFilterCount && !search} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] disabled:cursor-not-allowed disabled:opacity-40">
                  <RotateCcw size={16} /> გასუფთავება
                </button>
                <button type="submit" className="min-h-12 flex-[1.35] rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-sm transition hover:bg-[hsl(var(--primary)/.9)]">
                  ძიება
                </button>
              </footer>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}