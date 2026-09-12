import { useState } from "react";
import { useUser } from "@clerk/react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import {
  getGetItemQueryKey,
  useGetItem,
  useToggleItemFavorite,
} from "@workspace/api-client-react";
import { Avatar, ItemVisual, Notice } from "@/components/MarketplaceChrome";
import { ChatModal } from "@/components/ChatModal";

function formatPrice(price: number) {
  return `${price.toLocaleString("ka-GE")} ₾`;
}

export default function ItemDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn, user } = useUser();
  const { data: item, isLoading, isError, refetch } = useGetItem(id, {
    query: { queryKey: getGetItemQueryKey(id), enabled: Boolean(id) },
  });
  const favoriteMutation = useToggleItemFavorite();
  const [selectedImage, setSelectedImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [activeChat, setActiveChat] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-10">
        <div className="skeleton h-5 w-36 rounded" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.08fr_.92fr]">
          <div className="skeleton aspect-[1.06] rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-12 w-4/5 rounded" />
            <div className="skeleton h-8 w-1/3 rounded" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="mx-auto max-w-[760px] px-5 py-16 md:px-10">
        <Notice tone="error">
          ეს ნივთი ვერ მოიძებნა.{" "}
          <button
            type="button"
            className="ml-1 font-semibold underline"
            onClick={() => refetch()}
            data-testid="button-retry-item"
          >
            თავიდან ცდა
          </button>
        </Notice>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
          data-testid="link-back-marketplace"
        >
          <ArrowLeft size={16} /> უკან დაბრუნება
        </Link>
      </div>
    );
  }

  const gallery = Array.from(
    new Set(item.images?.length ? item.images : [item.image]),
  );
  const activeImage = gallery[selectedImage] ?? gallery[0] ?? item.image;
  const isFavorite = favorite || item.isFavorite || false;
  const sellerPhone = item.phone || item.seller.phoneNumber;
  const backLabel = "უკან დაბრუნება";

  const openMessageDialog = () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const returnTo = encodeURIComponent(`/listing/${item.id}`);
      setLocation(`/login?returnTo=${returnTo}`);
      return;
    }
    setActiveChat(true);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-7 md:px-10 md:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))]"
        data-testid="link-back-items"
      >
        <ArrowLeft size={16} /> {backLabel}
      </Link>

      <div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:gap-14">
        <section className="min-w-0">
          <div className="relative aspect-[1.06] overflow-hidden rounded-[2rem] bg-[hsl(var(--muted))]">
            <ItemVisual
              src={activeImage}
              title={item.title}
              className="h-full w-full"
            />
            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImage(
                      (selectedImage - 1 + gallery.length) % gallery.length,
                    )
                  }
                  className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[hsl(var(--card)/.9)] shadow-[var(--shadow-sm)] transition hover:bg-[hsl(var(--card))]"
                  aria-label="წინა ფოტო"
                  data-testid="button-gallery-previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImage((selectedImage + 1) % gallery.length)
                  }
                  className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[hsl(var(--card)/.9)] shadow-[var(--shadow-sm)] transition hover:bg-[hsl(var(--card))]"
                  aria-label="შემდეგი ფოტო"
                  data-testid="button-gallery-next"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            ) : null}
            <div
              className="absolute bottom-4 left-4 rounded-full bg-[hsl(var(--card)/.9)] px-3 py-1.5 font-mono-ui text-[10px] backdrop-blur-sm"
              data-testid="text-gallery-index"
            >
              {selectedImage + 1} / {gallery.length}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-3">
            {gallery.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square overflow-hidden rounded-xl border-2 bg-[hsl(var(--muted))] transition ${
                  selectedImage === index
                    ? "border-[hsl(var(--primary))]"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
                data-testid={`button-gallery-${index}`}
              >
                <img
                  src={image}
                  alt={`${item.title} ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
              <ShieldCheck size={16} className="text-[hsl(var(--accent))]" />
              აღწერა
            </div>
            <p
              className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[hsl(var(--foreground)/.85)]"
              data-testid="text-item-description"
            >
              {item.description || "აღწერა არ არის მითითებული."}
            </p>
          </section>
        </section>

        <section className="enter min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-[hsl(var(--primary)/.16)] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--foreground))]">
              {item.condition}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !isFavorite;
                setFavorite(next);
                favoriteMutation.mutate({ id: item.id });
              }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                isFavorite
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.16)]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
              }`}
              data-testid="button-detail-favorite"
            >
              <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? "შენახულია" : "შენახვა"}
            </button>
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
            <span>{item.category}</span>
            <span className="text-[hsl(var(--border))]">·</span>
            <span className="flex items-center gap-1">
              <CalendarDays size={13} /> {item.postedAt}
            </span>
          </p>
          <h1
            className="font-display mt-3 text-4xl font-semibold leading-[1.08] tracking-[-.06em] md:text-5xl"
            data-testid="text-item-title"
          >
            {item.title}
          </h1>
          <p
            className="mt-5 font-mono-ui text-3xl font-bold"
            data-testid="text-item-price"
          >
            {formatPrice(item.price)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--muted))] px-2.5 py-1.5">
              <MapPin size={13} />
              {item.city}
              {item.district ? ` · ${item.district}` : ""}
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--muted))] px-2.5 py-1.5">
              <CalendarDays size={13} /> {item.postedAt}
            </span>
          </div>

          {item.negotiable || item.tradeAvailable || item.deliveryAvailable ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {item.negotiable ? (
                <span className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary)/.14)] px-3 py-1.5 text-xs font-semibold">
                  ფასი შეთანხმებით
                </span>
              ) : null}
              {item.tradeAvailable ? (
                <span className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--accent)/.14)] px-3 py-1.5 text-xs font-semibold">
                  <Handshake size={14} /> გაცვლა
                </span>
              ) : null}
              {item.deliveryAvailable ? (
                <span className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--accent)/.14)] px-3 py-1.5 text-xs font-semibold">
                  <Truck size={14} /> მიტანის სერვისი
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-sm)] md:p-6">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
              გამყიდველი
            </p>
            <div className="mt-4 flex items-start gap-3">
              <Link href={`/seller/${item.seller.id}`}>
                <Avatar
                  initials={item.seller.initials}
                  size="lg"
                  testId="img-seller-avatar"
                  src={item.seller.avatarUrl ?? undefined}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/seller/${item.seller.id}`}
                  className="font-semibold hover:underline"
                  data-testid="text-seller-name"
                >
                  {item.seller.name}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1">
                    <Star
                      size={13}
                      className="fill-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                    />{" "}
                    {item.seller.rating.toFixed(1)}
                  </span>
                  <span>·</span>
                  <span>{item.seller.listings} განცხადება</span>
                </p>
                {item.seller.city ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <MapPin size={12} /> {item.seller.city}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--accent)/.13)] px-2.5 py-1.5 text-[11px] font-semibold">
                <BadgeCheck size={14} /> Saxeli პროფილი
              </span>
              {sellerPhone ? (
                <span className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-2.5 py-1.5 text-[11px] font-semibold">
                  <ShieldCheck size={14} /> ტელეფონი მითითებულია
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-2">
              {!item.chatOnly ? (
                phoneVisible && sellerPhone ? (
                  <a
                    href={`tel:${sellerPhone}`}
                    className="btn-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold"
                    data-testid="link-seller-phone"
                  >
                    <Phone size={17} /> {sellerPhone}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPhoneVisible(true)}
                    disabled={!sellerPhone}
                    className="btn-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                    data-testid="button-reveal-phone"
                  >
                    <Phone size={17} />{" "}
                    {sellerPhone ? "დარეკვა" : "ტელეფონი არ არის მითითებული"}
                  </button>
                )
              ) : null}
              {item.chatOnly ? (
                <div className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-center text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                  გამყიდველი მხოლოდ ჩატში პასუხობს
                </div>
              ) : null}
              {(isLoaded && (!user || user.id !== item.seller.id)) ? <button
                type="button"
                onClick={openMessageDialog}
                className="btn-ink flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold"
                data-testid="button-contact-seller"
              >
                <MessageCircle size={17} /> ჩატში მიწერა
              </button> : null}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-xl bg-[hsl(var(--muted)/.7)] p-3.5">
              <ShieldCheck
                size={19}
                className="shrink-0 text-[hsl(var(--accent))]"
              />
              <div>
                <p className="text-xs font-semibold">უსაფრთხო შეხვედრა</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                  ნივთი გადაამოწმე ადგილზე, სანამ გადაიხდი.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-[hsl(var(--muted)/.7)] p-3.5">
              <Truck
                size={19}
                className="shrink-0 text-[hsl(var(--accent))]"
              />
              <div>
                <p className="text-xs font-semibold">მიტანის არჩევანი</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {item.delivery?.length
                    ? item.delivery.join(" · ")
                    : "შეთანხმება ადგილზე"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {activeChat ? <ChatModal item={item} currentUser={user} onClose={() => setActiveChat(false)} /> : null}
    </div>
  );
}