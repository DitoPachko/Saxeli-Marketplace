import type { ReactNode } from 'react';
import { useClerk, useUser } from '@clerk/react';
import { Bookmark, Compass, Inbox, LogIn, LogOut, Plus, UserRound } from 'lucide-react';
import { Link, useLocation } from 'wouter';

type MarketplaceChromeProps = { children: ReactNode };

const navigation = [
  { href: '/', label: 'მოძებნა', icon: Compass },
  { href: '/profile', label: 'ჩემი Saxeli', icon: UserRound },
];

export function MarketplaceChrome({ children }: MarketplaceChromeProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  const isAuth =
    location.startsWith('/sign-in') ||
    location.startsWith('/sign-up') ||
    location === '/login' ||
    location === '/register';

  if (isAuth) return <div className="page-shell noise">{children}</div>;

  return (
    <div className="page-shell noise md:flex">
      <aside className="desktop-sidebar saxeli-nav sticky top-0 z-20 h-dvh w-[248px] shrink-0 flex-col justify-between px-5 py-7">
        <div>
          <Link href="/" className="mb-14 block px-3" data-testid="link-brand">
            <span className="saxeli-wordmark text-[2.25rem] leading-none text-[hsl(var(--sidebar-foreground))]">saxeli</span>
            <span className="mt-2 block font-mono-ui text-[9px] uppercase tracking-[.24em] text-[hsl(var(--sidebar-foreground)/.46)]">შენი ნივთების ადგილი</span>
          </Link>
          <nav className="space-y-2" aria-label="ძირითადი ნავიგაცია">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${location === href ? 'active' : ''}`} data-testid={`link-nav-${href === '/' ? 'browse' : 'profile'}`}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            ))}
            <Link href="/profile#saved" className="nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium" data-testid="link-nav-saved">
              <Bookmark size={18} strokeWidth={1.8} />
              <span>შენახული ნივთები</span>
            </Link>
            <Link href="/profile#messages" className="nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium" data-testid="link-nav-messages">
              <Inbox size={18} strokeWidth={1.8} />
              <span>შეტყობინებები</span>
              <span className="ml-auto rounded-full bg-[hsl(var(--primary))] px-1.5 py-0.5 font-mono-ui text-[10px] text-[hsl(var(--primary-foreground))]">3</span>
            </Link>
          </nav>
          <div className="mt-12 rounded-2xl bg-[hsl(var(--sidebar-accent))] p-4">
            <p className="font-display text-base leading-snug text-[hsl(var(--sidebar-foreground))]">ნივთს მეორე სიცოცხლე აქვს.</p>
            <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--sidebar-foreground)/.55)]">იპოვე ის, რაც შენს დღეს აკლდა — ახლოს, ადამიანთან.</p>
            <Link href="/sell" className="btn-primary mt-4 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold" data-testid="link-sidebar-sell">
              <Plus size={15} />
              გაყიდე ნივთი
            </Link>
          </div>
        </div>
        <div className="border-t border-[hsl(var(--sidebar-border))] pt-5">
          {isSignedIn ? (
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: '/' })}
              className="nav-link flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium"
              data-testid="button-sign-out"
            >
              <LogOut size={18} strokeWidth={1.8} />
              <span>გასვლა</span>
            </button>
          ) : (
            <Link href="/sign-in" className="nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium" data-testid="link-login">
              <LogIn size={18} strokeWidth={1.8} />
              <span>შესვლა</span>
            </Link>
          )}
          <p className="mt-6 px-3 font-mono-ui text-[9px] uppercase tracking-[.16em] text-[hsl(var(--sidebar-foreground)/.28)]">თბილისი · საქართველო</p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-30 items-center justify-around border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/.96)] px-2 py-2 backdrop-blur-md" aria-label="მობილური ნავიგაცია">
        <Link href="/" className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] ${location === '/' ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="link-mobile-browse">
          <Compass size={19} />
          მოძებნა
        </Link>
        <Link href="/sell" className="btn-primary -mt-7 flex h-14 w-14 items-center justify-center rounded-2xl shadow-[var(--shadow-md)]" data-testid="link-mobile-sell">
          <Plus size={25} />
        </Link>
        <Link href="/profile" className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] ${location === '/profile' ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="link-mobile-profile">
          <UserRound size={19} />
          პროფილი
        </Link>
      </nav>
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