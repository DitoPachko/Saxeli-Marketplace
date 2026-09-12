import type { ReactNode } from 'react';
import { useClerk, useUser } from '@clerk/react';
import { Facebook, Heart, Instagram, LogOut, MessageCircle, Moon, Plus, Search, Sun, UserRound } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useFilters } from '@/hooks/use-filters';
import { useTheme } from '@/hooks/use-theme';
import { CategoryMenuDesktop, CategoryMenuMobile } from '@/components/CategoryMenu';

type MarketplaceChromeProps = { children: ReactNode };

function Navbar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const { search, setSearch, setSubmittedSearch } = useFilters();
  const { isDark, toggleTheme } = useTheme();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search.trim());
  };

  const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
  const returnTo = encodeURIComponent(location + currentSearch);
  const savedReturnTo = encodeURIComponent('/saved');

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.9)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-2 px-3 py-2.5 sm:px-5 lg:gap-4 lg:px-10 lg:py-3">
        
        <div className="flex min-w-0 items-center gap-2 sm:gap-5 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="saxeli-wordmark text-[1.6rem] leading-none text-[hsl(var(--foreground))] sm:text-[1.85rem]">saxeli</span>
          </Link>
          <CategoryMenuDesktop />
        </div>
        
        <div className="hidden max-w-2xl flex-1 items-center px-4 lg:flex">
          <form onSubmit={handleSearchSubmit} className="flex w-full items-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--input)/.4)] transition-all focus-within:border-[hsl(var(--primary))] focus-within:bg-[hsl(var(--background))] focus-within:shadow-[var(--shadow-sm)]">
            <input 
              type="search"
              placeholder="რას ეძებ?" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-5 py-2.5 text-[15px] font-medium outline-none placeholder:text-[hsl(var(--muted-foreground))] placeholder:font-normal"
            />
            <button type="submit" className="flex h-full items-center justify-center px-5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
              <Search size={20} />
            </button>
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2 md:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'ღია რეჟიმის ჩართვა' : 'მუქი რეჟიმის ჩართვა'}
            aria-pressed={isDark}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent)/.1)] hover:text-[hsl(var(--foreground))]"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link href={isSignedIn ? "/saved" : `/login?returnTo=${savedReturnTo}`} aria-label="შენახული ნივთები" className="hidden h-11 w-11 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent)/.1)] hover:text-[hsl(var(--foreground))] sm:flex">
            <Heart size={20} />
          </Link>
          {isSignedIn ? (
            <Link href="/messages" aria-label="შეტყობინებები" className="flex h-11 w-11 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent)/.1)] hover:text-[hsl(var(--foreground))]">
              <MessageCircle size={20} />
            </Link>
          ) : null}
          
          {isSignedIn ? (
            <details className="group relative">
              <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-full px-1.5 hover:bg-[hsl(var(--accent)/.1)]">
                {user?.imageUrl ? <img src={user.imageUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <UserRound size={20} />}
                <span className="hidden max-w-28 truncate text-sm font-semibold lg:block">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</span>
              </summary>
              <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[var(--shadow-lg)]">
                <Link href="/profile" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))]">ჩემი პროფილი</Link>
                <Link href="/saved" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))]">შენახული ნივთები</Link>
                <Link href="/messages" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))]">შეტყობინებები</Link>
                <button type="button" onClick={() => signOut({ redirectUrl: '/' })} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-[hsl(var(--muted))]"><LogOut size={15} /> გასვლა</button>
              </div>
            </details>
          ) : (
            <>
            <Link href={`/login?returnTo=${returnTo}`} aria-label="შესვლა ან რეგისტრაცია" className="flex h-11 w-11 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/.1)] md:hidden"><UserRound size={20} /></Link>
            <div className="hidden items-center gap-3 lg:flex">
              <Link href={`/login?returnTo=${returnTo}`} className="text-sm font-semibold hover:text-[hsl(var(--primary))]">შესვლა</Link>
              <Link href={`/register?returnTo=${returnTo}`} className="text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">რეგისტრაცია</Link>
            </div>
            </>
          )}

          <Link href="/sell" aria-label="განცხადების დამატება" className="btn-primary flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold shadow-sm sm:px-4">
            <Plus size={18} />
            <span className="hidden lg:inline">გაყიდე</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search & Categories Row */}
      <div className="flex flex-col gap-3 border-t border-[hsl(var(--border))] px-3 py-2.5 sm:px-5 lg:hidden">
        <form onSubmit={handleSearchSubmit} className="flex w-full items-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--input)/.3)] transition-colors focus-within:border-[hsl(var(--primary))] focus-within:bg-[hsl(var(--background))]">
          <input 
            type="search"
            placeholder="რას ეძებ?" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-[hsl(var(--muted-foreground))]"
          />
          <button type="submit" className="flex min-h-12 min-w-12 items-center justify-center px-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
            <Search size={18} />
          </button>
        </form>
        <CategoryMenuMobile />
      </div>
    </nav>
  );
}

function Footer() {
  const { setCategorySlug } = useFilters();
  const openCategory = (slug: string) => {
    setCategorySlug(slug);
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
              <li><button onClick={() => openCategory('electronics')} className="hover:text-[hsl(var(--foreground))]">ტექნიკა</button></li>
              <li><button onClick={() => openCategory('beauty-fashion')} className="hover:text-[hsl(var(--foreground))]">სილამაზე და მოდა</button></li>
              <li><button onClick={() => openCategory('music')} className="hover:text-[hsl(var(--foreground))]">მუსიკა</button></li>
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
    <div className="page-shell noise flex min-h-[100dvh] max-w-full flex-col overflow-x-hidden">
      <Navbar />
      <main className="w-full min-w-0 flex-1 overflow-x-hidden">{children}</main>
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
