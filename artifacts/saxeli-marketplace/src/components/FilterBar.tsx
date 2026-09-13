import type { FormEvent } from 'react';
import { ChevronDown, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { cities, useFilters } from '@/hooks/use-filters';
import type { CategoryNode } from '@/hooks/use-categories';

type FeedSort = 'date' | 'priceAsc' | 'priceDesc';

type FilterBarProps = {
  categories: CategoryNode[];
  sort: FeedSort;
  onSortChange: (sort: FeedSort) => void;
};

const inputClass =
  'min-h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-base outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.15)] md:text-sm';

export function FilterBar({ categories, sort, onSortChange }: FilterBarProps) {
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

  const hasActiveFilters = Boolean(
    submittedSearch ||
    categorySlug ||
    city !== cities[0] ||
    minPrice ||
    maxPrice ||
    sort !== 'date',
  );

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  };

  const resetFilters = () => {
    clearFilters();
    onSortChange('date');
  };

  return (
    <section
      className="enter enter-delay-1 mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.72)] p-3 shadow-sm backdrop-blur-sm sm:p-4"
      aria-labelledby="marketplace-filters-title"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="marketplace-filters-title" className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={17} /> ძიება და ფილტრები
        </h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            data-testid="button-clear-filters"
          >
            <RotateCcw size={14} /> <span className="hidden sm:inline">ფილტრების გასუფთავება</span><span className="sm:hidden">გასუფთავება</span>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
        <form onSubmit={submitSearch} className="relative col-span-2 lg:col-span-4">
          <label htmlFor="filter-search" className="sr-only">ნივთის ძიება</label>
          <input
            id="filter-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="რას ეძებ?"
            className={`${inputClass} pl-11 pr-12`}
            data-testid="input-filter-search"
          />
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <button
            type="submit"
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            aria-label="ძიება"
          >
            <Search size={16} />
          </button>
        </form>

        <label className="relative col-span-2 sm:col-span-1 lg:col-span-2">
          <span className="sr-only">კატეგორია</span>
          <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} className={`${inputClass} cursor-pointer appearance-none pr-10`} data-testid="select-filter-category">
            <option value="">ყველა კატეგორია</option>
            {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        </label>

        <label className="col-span-1 lg:col-span-1">
          <span className="sr-only">მინიმალური ფასი</span>
          <input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="მინ. ფასი" className={inputClass} data-testid="input-min-price" />
        </label>

        <label className="col-span-1 lg:col-span-1">
          <span className="sr-only">მაქსიმალური ფასი</span>
          <input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="მაქს. ფასი" className={inputClass} data-testid="input-max-price" />
        </label>

        <label className="relative col-span-2 sm:col-span-1 lg:col-span-2">
          <span className="sr-only">ქალაქი</span>
          <select value={city} onChange={(event) => setCity(event.target.value)} className={`${inputClass} cursor-pointer appearance-none pr-10`} data-testid="select-city">
            {cities.map((option) => <option key={option}>{option}</option>)}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        </label>

        <label className="relative col-span-2 sm:col-span-1 lg:col-span-2">
          <span className="sr-only">დალაგება</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value as FeedSort)} className={`${inputClass} cursor-pointer appearance-none pr-10`} data-testid="select-feed-sort">
            <option value="date">ახალი დამატებული</option>
            <option value="priceAsc">ფასი: დაბლიდან მაღლა</option>
            <option value="priceDesc">ფასი: მაღლიდან დაბლა</option>
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        </label>
      </div>
    </section>
  );
}