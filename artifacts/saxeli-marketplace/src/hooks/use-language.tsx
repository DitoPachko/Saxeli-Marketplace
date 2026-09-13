import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'ka' | 'en';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (ka: string, en: string) => string;
  categoryName: (slug: string, fallback: string) => string;
  cityName: (city: string) => string;
};

const categoryNames: Record<string, string> = {
  'home-appliances': 'Home appliances',
  'kitchen-appliances': 'Kitchen appliances',
  refrigerators: 'Refrigerators',
  cookers: 'Cookers',
  'home-care-appliances': 'Home care',
  'washing-machines': 'Washing machines',
  'vacuum-cleaners': 'Vacuum cleaners',
  electronics: 'Electronics',
  phones: 'Phones',
  smartphones: 'Smartphones',
  'phone-accessories': 'Phone accessories',
  computers: 'Computers',
  laptops: 'Laptops',
  'computer-parts': 'Computer parts',
  'audio-video': 'Audio & video',
  televisions: 'Televisions',
  headphones: 'Headphones',
  'hunting-fishing': 'Hunting & fishing',
  fishing: 'Fishing',
  'fishing-rods': 'Fishing rods',
  'fishing-bait': 'Fishing bait',
  hunting: 'Hunting',
  'hunting-gear': 'Hunting gear',
  'hunting-optics': 'Optics',
  music: 'Music',
  instruments: 'Instruments',
  guitars: 'Guitars',
  keyboards: 'Keyboards',
  studio: 'Studio',
  microphones: 'Microphones',
  'audio-equipment': 'Audio equipment',
  kids: 'Kids',
  toys: 'Toys',
  'educational-toys': 'Educational toys',
  'outdoor-toys': 'Outdoor toys',
  'baby-items': 'Baby items',
  strollers: 'Strollers',
  'kids-furniture': 'Kids furniture',
  'beauty-fashion': 'Beauty & fashion',
  clothing: 'Clothing',
  'womens-clothing': "Women's clothing",
  'mens-clothing': "Men's clothing",
  beauty: 'Beauty',
  cosmetics: 'Cosmetics',
  perfumes: 'Perfumes',
  'construction-repair': 'Construction & repair',
  'building-materials': 'Building materials',
  'wood-metal': 'Wood & metal',
  paint: 'Paint',
  tools: 'Tools',
  'power-tools': 'Power tools',
  'hand-tools': 'Hand tools',
  'pets-animals': 'Pets & animals',
  pets: 'Pets',
  dogs: 'Dogs',
  cats: 'Cats',
  'pet-supplies': 'Pet supplies',
  'pet-food': 'Pet food',
  'pet-care': 'Pet care',
  'sports-leisure': 'Sports & leisure',
  sports: 'Sports',
  fitness: 'Fitness',
  'team-sports': 'Team sports',
  leisure: 'Leisure',
  camping: 'Camping',
  bicycles: 'Bicycles',
  'business-equipment': 'Business equipment',
  'industrial-equipment': 'Industrial equipment',
  manufacturing: 'Manufacturing equipment',
  generators: 'Generators',
  'retail-equipment': 'Retail equipment',
  showcases: 'Display cases',
  'pos-systems': 'POS systems',
  'books-stationery': 'Books & stationery',
  books: 'Books',
  fiction: 'Fiction',
  'educational-books': 'Educational books',
  stationery: 'Stationery',
  'office-supplies': 'Office supplies',
  'art-supplies': 'Art supplies',
  'art-collectibles': 'Art & collectibles',
  art: 'Art',
  paintings: 'Paintings',
  handmade: 'Handmade',
  collectibles: 'Collectibles',
  coins: 'Coins',
  antiques: 'Antiques',
};

const cityNames: Record<string, string> = {
  'ყველა ქალაქი': 'All cities',
  თბილისი: 'Tbilisi',
  ბათუმი: 'Batumi',
  ქუთაისი: 'Kutaisi',
  რუსთავი: 'Rustavi',
  ზუგდიდი: 'Zugdidi',
  ფოთი: 'Poti',
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
    if (requestedLanguage === 'en' || requestedLanguage === 'ka') return requestedLanguage;
    return window.localStorage.getItem('saxeli-language') === 'en' ? 'en' : 'ka';
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem('saxeli-language', nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage: () => setLanguage(language === 'ka' ? 'en' : 'ka'),
        t: (ka, en) => language === 'ka' ? ka : en,
        categoryName: (slug, fallback) => language === 'ka' ? fallback : categoryNames[slug] ?? fallback,
        cityName: (city) => language === 'ka' ? city : cityNames[city] ?? city,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}