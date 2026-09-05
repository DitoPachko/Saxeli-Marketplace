import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';

export const cities = ['ყველა ქალაქი', 'თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'ზუგდიდი', 'ფოთი'];

type FilterState = {
  search: string;
  setSearch: (val: string) => void;
  submittedSearch: string;
  setSubmittedSearch: (val: string) => void;
  categorySlug: string;
  setCategorySlug: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
};

const FilterContext = createContext<FilterState | null>(null);

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within a FilterProvider");
  return ctx;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();

  const searchParams = new URLSearchParams(searchString);
  const categorySlug = searchParams.get('category') || '';
  const submittedSearch = searchParams.get('q') || '';
  const city = searchParams.get('city') || cities[0];

  const [search, setSearch] = useState(submittedSearch);

  const prevSub = useRef(submittedSearch);
  useEffect(() => {
    if (submittedSearch !== prevSub.current) {
      setSearch(submittedSearch);
      prevSub.current = submittedSearch;
    }
  }, [submittedSearch]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchString);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'city' && value === cities[0])) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const currentHash = window.location.hash;
    const query = params.toString();
    setLocation(`/${query ? `?${query}` : ''}${currentHash}`);
  };

  const setSubmittedSearch = (val: string) => updateUrl({ q: val });
  const setCategorySlug = (val: string) => updateUrl({ category: val });
  const setCity = (val: string) => updateUrl({ city: val });

  return (
    <FilterContext.Provider value={{ search, setSearch, submittedSearch, setSubmittedSearch, categorySlug, setCategorySlug, city, setCity }}>
      {children}
    </FilterContext.Provider>
  );
}
