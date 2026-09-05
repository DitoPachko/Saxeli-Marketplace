import { createContext, useContext, useState, ReactNode } from 'react';

export const categories = ['ყველა კატეგორია', 'ტექნიკა', 'ტანსაცმელი', 'სახლი', 'ჰობი', 'ბავშვები'];
export const cities = ['ყველა ქალაქი', 'თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი'];

type FilterState = {
  search: string;
  setSearch: (val: string) => void;
  submittedSearch: string;
  setSubmittedSearch: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
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
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [city, setCity] = useState(cities[0]);

  return (
    <FilterContext.Provider value={{ search, setSearch, submittedSearch, setSubmittedSearch, category, setCategory, city, setCity }}>
      {children}
    </FilterContext.Provider>
  );
}
