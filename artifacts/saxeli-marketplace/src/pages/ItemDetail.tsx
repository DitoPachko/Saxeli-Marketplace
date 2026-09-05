import type { FormEvent } from 'react';
import { useState } from 'react';
import { ArrowLeft, Check, Heart, MapPin, MessageCircle, PackageCheck, Send, ShieldCheck, Star, X } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { getGetItemQueryKey, useGetItem, useToggleItemFavorite } from '@workspace/api-client-react';
import { Avatar, ItemVisual, Notice } from '@/components/MarketplaceChrome';

function formatPrice(price: number) { return `${price.toLocaleString('ka-GE')} ₾`; }

export default function ItemDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const { data: item, isLoading, isError, refetch } = useGetItem(id, { query: { queryKey: getGetItemQueryKey(id), enabled: Boolean(id) } });
  const favoriteMutation = useToggleItemFavorite();
  const [selectedImage, setSelectedImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [dialog, setDialog] = useState<'message' | 'offer' | null>(null);
  const [sent, setSent] = useState(false);

  if (isLoading) return <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-10"><div className="skeleton h-5 w-20 rounded" /><div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><div className="skeleton aspect-square rounded-3xl" /><div className="space-y-4"><div className="skeleton h-12 w-4/5 rounded" /><div className="skeleton h-8 w-1/3 rounded" /><div className="skeleton h-40 rounded-2xl" /></div></div></div>;
  if (isError || !item) return <div className="mx-auto max-w-[760px] px-5 py-16 md:px-10"><Notice tone="error">ეს ნივთი ვერ მოიძებნა. <button type="button" className="ml-1 font-semibold underline" onClick={() => refetch()} data-testid="button-retry-item">თავიდან ცდა</button></Notice><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" data-testid="link-back-marketplace"><ArrowLeft size={16} /> ბაზარზე დაბრუნება</Link></div>;

  const gallery = item.images?.length ? item.images : [item.image];
  const isFavorite = favorite || item.isFavorite || false;
  const submitDialog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-7 md:px-10 md:py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))]" data-testid="link-back-items"><ArrowLeft size={16} /> ყველა ნივთი</Link>
      <div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,.94fr)] lg:gap-14">
        <section>
          <div className="relative aspect-[1.06] overflow-hidden rounded-[2rem] bg-[hsl(var(--muted))]">
            <ItemVisual src={gallery[selectedImage]} title={item.title} className="h-full w-full" />
            <div className="absolute bottom-4 left-4 rounded-full bg-[hsl(var(--card)/.9)] px-3 py-1.5 font-mono-ui text-[10px] backdrop-blur-sm" data-testid="text-gallery-index">{selectedImage + 1} / {gallery.length}</div>
          </div>
          {gallery.length > 1 ? <div className="mt-3 grid grid-cols-5 gap-3">{gallery.map((image, index) => <button type="button" key={image} onClick={() => setSelectedImage(index)} className={`aspect-square overflow-hidden rounded-xl border-2 bg-[hsl(var(--muted))] ${selectedImage === index ? 'border-[hsl(var(--primary))]' : 'border-transparent opacity-70 hover:opacity-100'}`} data-testid={`button-gallery-${index}`}><img src={image} alt={`${item.title} ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div> : null}
        </section>
        <section className="enter">
          <div className="flex items-center justify-between gap-4"><span className="rounded-full bg-[hsl(var(--primary)/.2)] px-3 py-1 font-mono-ui text-[10px] uppercase tracking-[.12em]">{item.condition}</span><button type="button" onClick={() => { const next = !isFavorite; setFavorite(next); favoriteMutation.mutate({ id: item.id }); }} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${isFavorite ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.16)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]'}`} data-testid="button-detail-favorite"><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'შენახულია' : 'შენახვა'}</button></div>
          <h1 className="font-display mt-5 text-4xl font-semibold leading-[1.1] tracking-[-.06em] md:text-5xl" data-testid="text-item-title">{item.title}</h1>
          <p className="mt-5 font-mono-ui text-2xl font-bold" data-testid="text-item-price">{formatPrice(item.price)}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="flex items-center gap-1 rounded-lg bg-[hsl(var(--muted))] px-2.5 py-1.5"><MapPin size={13} /> {item.city}</span><span className="rounded-lg bg-[hsl(var(--muted))] px-2.5 py-1.5">{item.category}</span></div>
          {item.description ? <p className="mt-8 text-[15px] leading-7 text-[hsl(var(--muted-foreground))]" data-testid="text-item-description">{item.description}</p> : null}
          <div className="mt-8 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => { setDialog('message'); setSent(false); }} className="btn-ink flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold" data-testid="button-contact-seller"><MessageCircle size={17} /> მიწერე გამყიდველს</button><button type="button" onClick={() => { setDialog('offer'); setSent(false); }} className="btn-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold" data-testid="button-make-offer">შეთავაზე ფასი <Send size={16} /></button></div>
          <div className="mt-10 border-t border-[hsl(var(--border))] pt-6"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">გამყიდველი</p><div className="mt-4 flex items-center gap-3"><Link href={`/seller/${(item.seller as any).id || "unknown"}`}><Avatar initials={item.seller.initials} size="md" testId="img-seller-avatar" src={(item.seller as any).avatarUrl} /></Link><div><Link href={`/seller/${(item.seller as any).id || "unknown"}`} className="font-semibold hover:underline" data-testid="text-seller-name">{item.seller.name}</Link><p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Star size={13} className="fill-[hsl(var(--primary))] text-[hsl(var(--primary))]" /> {item.seller.rating.toFixed(1)} · {item.seller.listings} განცხადება { (item.seller as any).city && <span>· {(item.seller as any).city}</span> } { (item.seller as any).phoneNumber && <span>· {(item.seller as any).phoneNumber}</span> }</p></div><span className="ml-auto rounded-lg bg-[hsl(var(--accent)/.14)] px-2 py-1 text-[10px] text-[hsl(var(--foreground))]">{item.seller.responseTime ?? 'სწრაფი პასუხი'}</span></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="flex gap-3 rounded-xl bg-[hsl(var(--muted)/.7)] p-3.5"><ShieldCheck size={19} className="shrink-0 text-[hsl(var(--accent))]" /><div><p className="text-xs font-semibold">Saxeli-ს დაცვა</p><p className="mt-1 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">ნივთი გადაამოწმე ადგილზე, სანამ გადაიხდი.</p></div></div><div className="flex gap-3 rounded-xl bg-[hsl(var(--muted)/.7)] p-3.5"><PackageCheck size={19} className="shrink-0 text-[hsl(var(--accent))]" /><div><p className="text-xs font-semibold">მიტანის არჩევანი</p><p className="mt-1 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">{item.delivery?.join(' · ') ?? 'შეთანხმება ადგილზე'}</p></div></div></div>
        </section>
      </div>
      {dialog ? <div className="fixed inset-0 z-40 flex items-end justify-center bg-[hsl(var(--secondary)/.45)] p-4 backdrop-blur-sm md:items-center"><div className="w-full max-w-md rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-xl)] enter" role="dialog" aria-modal="true">{sent ? <div className="py-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--accent)/.18)]"><Check size={25} /></div><h2 className="font-display mt-4 text-2xl font-semibold">{dialog === 'offer' ? 'შეთავაზება გაიგზავნა' : 'შეტყობინება გაიგზავნა'}</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">გამყიდველი მალე დაგიბრუნდება პასუხით.</p><button type="button" onClick={() => setDialog(null)} className="btn-ink mt-6 rounded-xl px-5 py-3 text-sm font-bold" data-testid="button-close-sent">დახურვა</button></div> : <><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{dialog === 'offer' ? 'შეთავაზება' : 'ახალი შეტყობინება'}</p><h2 className="font-display mt-1 text-2xl font-semibold">{dialog === 'offer' ? 'რა ფასს სთავაზობ?' : `მიწერე ${item.seller.name}-ს`}</h2></div><button type="button" onClick={() => setDialog(null)} className="rounded-lg p-2 hover:bg-[hsl(var(--muted))]" aria-label="დახურვა" data-testid="button-close-dialog"><X size={18} /></button></div><form onSubmit={submitDialog} className="mt-6 space-y-4">{dialog === 'offer' ? <label className="block text-sm font-medium">შენი ფასი<input required type="number" min="0" className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3 outline-none focus:border-[hsl(var(--primary))]" placeholder={`${item.price}`} data-testid="input-offer-price" /></label> : null}<label className="block text-sm font-medium">{dialog === 'offer' ? 'მოკლე კომენტარი' : 'შეტყობინება'}<textarea required rows={4} className="mt-2 w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]" placeholder="დაწერე აქ..." data-testid="input-message" /></label><button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold" data-testid="button-send-dialog"><Send size={16} /> გაგზავნა</button></form></>}</div></div> : null}
    </div>
  );
}