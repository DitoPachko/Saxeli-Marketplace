import type { FormEvent } from 'react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  LayoutGrid,
  CreditCard,
  MapPin,
  ArrowDownWideNarrow
} from 'lucide-react';
import { cities, useFilters } from '@/hooks/use-filters';
import type { CategoryNode } from '@/hooks/use-categories';
import { useLanguage } from '@/hooks/use-language';

type FeedSort = 'date' | 'priceAsc' | 'priceDesc';

type FilterBarProps = {
  categories: CategoryNode[];
  sort: FeedSort;
  onSortChange: (sort: FeedSort) => void;
};

const fieldClass =
  'min-h-[3.5rem] w-full rounded-[1rem] border-2 border-transparent bg-[hsl(var(--muted))] px-4 text-[15px] font-semibold text-[hsl(var(--foreground))] outline-none transition-all placeholder:font-medium placeholder:text-[hsl(var(--muted-foreground))] hover:brightness-95 focus:border-[hsl(var(--primary))] focus:bg-[hsl(var(--background))] focus:shadow-[0_0_0_4px_hsl(var(--primary)/.15)] dark:hover:brightness-110';

export function FilterBar({ categories, sort, onSortChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t, categoryName, cityName } = useLanguage();
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
    <div className="enter enter-delay-1 relative z-20 mt-8 mb-4">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="group relative flex w-full items-center justify-between rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 pl-5 pr-2 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-[hsl(var(--primary)/.4)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] sm:p-2.5 sm:pl-7 sm:pr-2.5 md:rounded-[2rem]"
            data-testid="button-open-filters"
          >
            <div className="flex w-full min-w-0 items-center gap-4 text-left">
              <Search size={22} strokeWidth={2.5} className="shrink-0 text-[hsl(var(--primary))]" />
              <div className="flex min-w-0 flex-col justify-center py-2 sm:flex-row sm:items-center sm:gap-3 sm:py-1">
                <span className="truncate text-[15px] font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-lg">
                  {search || t('რას ეძებ?', 'What are you looking for?')}
                </span>
                <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--border))] sm:block" />
                <span className="truncate text-[13px] font-medium text-[hsl(var(--muted-foreground))] sm:text-[15px]">
                  {categorySlug
                    ? categoryName(categorySlug, categories.find(c => c.slug === categorySlug)?.name || t('ყველა კატეგორია', 'All categories'))
                    : t('ყველა კატეგორია', 'All categories')}
                  {city !== cities[0] ? ` • ${cityName(city)}` : ''}
                </span>
              </div>
            </div>
            <div className="relative ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12">
              <SlidersHorizontal size={18} strokeWidth={2.5} />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[hsl(var(--card))] bg-[hsl(var(--primary))] px-1 font-mono-ui text-[10px] font-bold text-[hsl(var(--primary-foreground))]">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-[hsl(var(--secondary)/.4)] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
          <Dialog.Content
            className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[2.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[min(90dvh,720px)] sm:w-[min(640px,calc(100%-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2.5rem] sm:shadow-2xl"
            aria-describedby="filter-dialog-description"
          >
            <header className="relative flex shrink-0 items-center justify-between border-b border-[hsl(var(--border))] px-6 py-5 sm:px-8 sm:py-6">
              <div>
                <Dialog.Title className="font-display text-2xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))]">{t('ფილტრები', 'Filters')}</Dialog.Title>
                <Dialog.Description id="filter-dialog-description" className="mt-1 text-[13px] font-medium text-[hsl(var(--muted-foreground))]">
                  {t('იპოვე ზუსტად ის, რასაც ეძებ', 'Narrow down the listings to find the right item')}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))]" aria-label={t('ფილტრების დახურვა', 'Close filters')}>
                  <X size={20} strokeWidth={2.5} />
                </button>
              </Dialog.Close>
            </header>

            <form onSubmit={applyFilters} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-7 sm:space-y-8 sm:px-8">

                <div className="space-y-3">
                  <label htmlFor="filter-search" className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[hsl(var(--foreground))]">
                    <Search size={18} strokeWidth={2.5} className="text-[hsl(var(--primary))]" />
                    {t('საძიებო სიტყვა', 'Search')}
                  </label>
                  <div className="relative">
                    <input
                      id="filter-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t('მაგ: მაგიდა, ველოსიპედი, iPhone...', 'For example: table, bicycle, iPhone...')}
                      className={`${fieldClass} pl-12`}
                      data-testid="input-filter-search"
                    />
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[hsl(var(--foreground))]">
                    <LayoutGrid size={18} strokeWidth={2.5} className="text-[hsl(var(--primary))]" />
                    {t('კატეგორია', 'Category')}
                  </label>
                  <div className="relative">
                    <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} className={`${fieldClass} cursor-pointer appearance-none pr-12`} data-testid="select-filter-category">
                      <option value="">{t('ყველა კატეგორია', 'All categories')}</option>
                      {categories.map((category) => <option key={category.id} value={category.slug}>{categoryName(category.slug, category.name)}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] shadow-sm">
                      <ChevronDown size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[hsl(var(--foreground))]">
                    <CreditCard size={18} strokeWidth={2.5} className="text-[hsl(var(--primary))]" />
                    {t('ფასის დიაპაზონი (₾)', 'Price range (₾)')}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder={t('მინ.', 'Min.')} className={`${fieldClass} pl-[2.25rem]`} data-testid="input-min-price" />
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono-ui text-[15px] font-bold text-[hsl(var(--muted-foreground))]">₾</span>
                    </div>
                    <div className="h-0.5 w-3 shrink-0 rounded-full bg-[hsl(var(--border))]" />
                    <div className="relative flex-1">
                      <input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder={t('მაქს.', 'Max.')} className={`${fieldClass} pl-[2.25rem]`} data-testid="input-max-price" />
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono-ui text-[15px] font-bold text-[hsl(var(--muted-foreground))]">₾</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-7 sm:grid-cols-2 sm:gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[hsl(var(--foreground))]">
                      <MapPin size={18} strokeWidth={2.5} className="text-[hsl(var(--primary))]" />
                      {t('ლოკაცია', 'Location')}
                    </label>
                    <div className="relative">
                      <select value={city} onChange={(event) => setCity(event.target.value)} className={`${fieldClass} cursor-pointer appearance-none pr-12`} data-testid="select-city">
                        {cities.map((option) => <option key={option} value={option}>{cityName(option)}</option>)}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] shadow-sm">
                        <ChevronDown size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[hsl(var(--foreground))]">
                      <ArrowDownWideNarrow size={18} strokeWidth={2.5} className="text-[hsl(var(--primary))]" />
                      {t('დალაგება', 'Sort by')}
                    </label>
                    <div className="relative">
                      <select value={sort} onChange={(event) => onSortChange(event.target.value as FeedSort)} className={`${fieldClass} cursor-pointer appearance-none pr-12`} data-testid="select-feed-sort">
                        <option value="date">{t('ახალი დამატებული', 'Newest first')}</option>
                        <option value="priceAsc">{t('ფასი: დაბლიდან მაღლა', 'Price: low to high')}</option>
                        <option value="priceDesc">{t('ფასი: მაღლიდან დაბლა', 'Price: high to low')}</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] shadow-sm">
                        <ChevronDown size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="flex shrink-0 items-center gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5 sm:gap-4 sm:px-8">
                <button type="button" onClick={resetFilters} disabled={!activeFilterCount && !search} className="flex h-[3.5rem] w-[3.5rem] shrink-0 items-center justify-center rounded-[1rem] border-2 border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] transition-all hover:border-[hsl(var(--foreground))] hover:text-[hsl(var(--foreground))] disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:px-6 sm:font-bold">
                  <RotateCcw size={20} strokeWidth={2.5} className="sm:mr-2 sm:h-[18px] sm:w-[18px]" />
                  <span className="hidden sm:inline">{t('გასუფთავება', 'Clear')}</span>
                </button>
                <button type="submit" className="flex h-[3.5rem] flex-1 items-center justify-center gap-2 rounded-[1rem] bg-[hsl(var(--primary))] px-6 text-[16px] font-bold text-[hsl(var(--primary-foreground))] shadow-[0_4px_14px_hsl(var(--primary)/.2)] transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_8px_24px_hsl(var(--primary)/.3)] active:translate-y-0 active:shadow-none">
                  <Search size={18} strokeWidth={2.5} />
                  {t('ძიება', 'Search')}
                </button>
              </footer>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
