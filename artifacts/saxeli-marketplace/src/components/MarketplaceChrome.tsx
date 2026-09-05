import type { ReactNode } from 'react';
import { useClerk, useUser } from '@clerk/react';
import { AlignLeft, Facebook, Heart, Instagram, LogOut, Plus, Search, UserRound } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useFilters, categories } from '@/hooks/use-filters';

type MarketplaceChromeProps = { children: ReactNode };

function Navbar() {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const { search, setSearch, setSubmittedSearch, category, setCategory } = useFilters();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search.trim());
    if (location !== '/') {
      setLocation('/');
    }
  };

  const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
  const returnTo = encodeURIComponent(location + currentSearch);
  const savedReturnTo = encodeURIComponent('/profile#saved');

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.82)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-5 py-3 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="saxeli-wordmark text-[1.75rem] leading-none text-[hsl(var(--foreground))]">saxeli</span>
        </Link>
        
        <div className="hidden flex-1 max-w-2xl items-center md:flex">
          <form onSubmit={handleSearchSubmit} className="flex w-full items-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--input)/.3)] transition-colors focus-within:border-[hsl(var(--primary))] focus-within:bg-[hsl(var(--background))]">
            <select 
              value={category} 
              onChange={(e) => { setCategory(e.target.value); if(location !== '/') setLocation('/'); }} 
              className="h-full cursor-pointer appearance-none bg-transparent px-4 py-2 text-sm font-medium outline-none border-r border-[hsl(var(--border))]"
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <input 
              type="search"
              placeholder="რას ეძებ?" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
            />
            <button type="submit" className="flex h-full items-center justify-center px-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
              <Search size={18} />
            </button>
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <Link href={isSignedIn ? "/profile#saved" : `/login?returnTo=${savedReturnTo}`} aria-label="შენახული ნივთები" className="flex items-center justify-center rounded-full p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/.1)] hover:text-[hsl(var(--foreground))] transition-colors">
            <Heart size={20} />
          </Link>
          
          {isSignedIn ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 pr-2 hover:bg-[hsl(var(--accent)/.1)]">
                {user?.imageUrl ? <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <UserRound size={20} />}
                <span className="hidden max-w-28 truncate text-sm font-semibold lg:block">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</span>
              </summary>
              <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[var(--shadow-lg)]">
                <Link href="/profile" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))]">ჩემი პროფილი</Link>
                <Link href="/profile#saved" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))]">შენახული ნივთები</Link>
                <button type="button" onClick={() => signOut({ redirectUrl: '/' })} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-[hsl(var(--muted))]"><LogOut size={15} /> გასვლა</button>
              </div>
            </details>
          ) : (
            <>
            <Link href={`/login?returnTo=${returnTo}`} aria-label="შესვლა ან რეგისტრაცია" className="flex items-center justify-center rounded-full p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/.1)] md:hidden"><UserRound size={20} /></Link>
            <div className="hidden items-center gap-3 md:flex">
              <Link href={`/login?returnTo=${returnTo}`} className="text-sm font-semibold hover:text-[hsl(var(--primary))]">შესვლა</Link>
              <Link href={`/register?returnTo=${returnTo}`} className="text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">რეგისტრაცია</Link>
            </div>
            </>
          )}

          <Link href="/sell" className="btn-primary flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm">
            <Plus size={16} />
            <span className="hidden md:inline">გაყიდე</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="border-t border-[hsl(var(--border))] px-5 py-3 md:hidden">
        <div className="flex flex-col gap-2">
           <form onSubmit={handleSearchSubmit} className="flex w-full items-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--input)/.3)] transition-colors focus-within:border-[hsl(var(--primary))] focus-within:bg-[hsl(var(--background))]">
             <input 
               type="search"
               placeholder="რას ეძებ?" 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
             />
             <button type="submit" className="flex h-full items-center justify-center px-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
               <Search size={18} />
             </button>
           </form>
        </div>
      </div>
      
      {/* Quick category links for Desktop and Mobile */}
      <div className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto flex max-w-[1320px] items-center gap-6 overflow-x-auto px-5 py-2.5 text-sm md:px-10 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <span className="flex shrink-0 items-center gap-2 text-[hsl(var(--muted-foreground))]"><AlignLeft size={16} /> კატეგორიები:</span>
          <button 
              onClick={() => { setCategory(categories[0]); setLocation('/'); }} 
              className={`whitespace-nowrap shrink-0 font-medium transition-colors hover:text-[hsl(var(--primary))] ${category === categories[0] ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}
            >
              {categories[0]}
          </button>
          {categories.slice(1).map(c => (
            <button 
              key={c} 
              onClick={() => { setCategory(c); setLocation('/'); }} 
              className={`whitespace-nowrap shrink-0 font-medium transition-colors hover:text-[hsl(var(--primary))] ${category === c ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const [, setLocation] = useLocation();
  const { setCategory } = useFilters();
  const openCategory = (value: string) => {
    setCategory(value);
    setLocation('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <footer className="mt-auto border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <span className="saxeli-wordmark text-3xl leading-none text-[hsl(var(--foreground))]">saxeli</span>
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] max-w-[200px]">
              შენი ნივთების ადგილი. იპოვე ის, რაც შენს დღეს აკლდა — ახლოს, ადამიანთან.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">კატეგორიები</h3>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li><button onClick={() => openCategory('ავტო / მოტო')} className="hover:text-[hsl(var(--foreground))]">მანქანები (Vehicles)</button></li>
              <li><button onClick={() => openCategory('უძრავი ქონება')} className="hover:text-[hsl(var(--foreground))]">უძრავი ქონება (Real Estate)</button></li>
              <li><button onClick={() => openCategory('ტექნიკა')} className="hover:text-[hsl(var(--foreground))]">ელექტრონიკა (Electronics)</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">ინფორმაცია</h3>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li><Link href="/about" className="hover:text-[hsl(var(--foreground))]">ჩვენ შესახებ</Link></li>
              <li><Link href="/terms" className="hover:text-[hsl(var(--foreground))]">წესები და პირობები</Link></li>
              <li><Link href="/privacy" className="hover:text-[hsl(var(--foreground))]">კონფიდენციალურობა</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">დახმარება</h3>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li><a href="mailto:support@saxeli.ge" className="hover:text-[hsl(var(--foreground))]">support@saxeli.ge</a></li>
              <li><a href="tel:+995555123456" className="hover:text-[hsl(var(--foreground))]">+995 555 12 34 56</a></li>
              <li><Link href="/help" className="hover:text-[hsl(var(--foreground))]">დახმარების ცენტრი</Link></li>
              <li className="flex gap-3 pt-2"><a href="https://instagram.com" aria-label="Instagram" className="hover:text-[hsl(var(--foreground))]"><Instagram size={18} /></a><a href="https://facebook.com" aria-label="Facebook" className="hover:text-[hsl(var(--foreground))]"><Facebook size={18} /></a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[hsl(var(--border))] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[hsl(var(--muted-foreground))]">
          <p>© 2026 Saxeli Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export function MarketplaceChrome({ children }: MarketplaceChromeProps) {
  const [location] = useLocation();
  const isAuth =
    location.startsWith('/sign-in') ||
    location.startsWith('/sign-up') ||
    location === '/login' ||
    location === '/register';

  if (isAuth) return <div className="page-shell noise">{children}</div>;

  return (
    <div className="page-shell noise flex flex-col min-h-[100dvh]">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.82)] px-5 py-6 backdrop-blur-md md:px-10 md:py-8">
      <div className="mx-auto flex max-w-[1320px] items-start justify-between gap-4">
        <div>
          {eyebrow && <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">{eyebrow}</p>}
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-[-.04em] md:text-3xl">{title}</h1>
        </div>
        {children}
      </div>
    </header>
  );
}

export function Avatar({ initials, size = 'md', testId, src }: { initials: string; size?: 'sm' | 'md' | 'lg'; testId?: string; src?: string }) {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-16 w-16 text-lg' };
  return <span className={`relative overflow-hidden inline-flex shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent)/.22)] font-semibold text-[hsl(var(--foreground))] ${sizes[size]}`} data-testid={testId}>{src ? <img src={src} alt={initials} className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} /> : null}<span>{initials}</span></span>;
}

export function ItemVisual({ src, title, className = '' }: { src?: string; title: string; className?: string }) {
  return (
    <div className={`image-sheen relative bg-[hsl(var(--muted))] ${className}`} data-testid={`img-item-${title}`}>
      {src ? <img src={src} alt={title} className="relative z-10 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : null}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-[linear-gradient(135deg,hsl(var(--primary)/.42),hsl(var(--accent)/.3))] p-5 text-center font-display text-xl text-[hsl(var(--foreground)/.72)]">{title.slice(0, 1)}</div>
    </div>
  );
}

export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'success' | 'error' }) {
  const toneClass = tone === 'success' ? 'border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.1)]' : tone === 'error' ? 'border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)]' : 'border-[hsl(var(--primary)/.3)] bg-[hsl(var(--primary)/.1)]';
  return <div className={`rounded-xl border px-4 py-3 text-sm ${toneClass}`} data-testid={`notice-${tone}`}>{children}</div>;
}
