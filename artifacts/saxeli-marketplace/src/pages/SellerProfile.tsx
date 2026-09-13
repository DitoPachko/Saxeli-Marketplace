import { useRoute } from "wouter";
import { Star, MapPin, Package } from "lucide-react";
import {
  useGetSellerProfile,
  useListItems,
  getGetSellerProfileQueryKey,
  getListItemsQueryKey,
} from "@workspace/api-client-react";
import { Avatar, ItemVisual, Notice } from "@/components/MarketplaceChrome";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";

function price(value: number) {
  return `${value.toLocaleString("ka-GE")} ₾`;
}

export default function SellerProfile() {
  const [match, params] = useRoute("/seller/:id");
  const id = params?.id;
  const { t, language, cityName } = useLanguage();

  const { data: profile, isLoading: profileLoading, isError } = useGetSellerProfile(id ?? "", {
    query: { enabled: !!id, queryKey: getGetSellerProfileQueryKey(id ?? "") },
  });

  const { data: items } = useListItems({ limit: 100 }, {
    query: { queryKey: getListItemsQueryKey({ limit: 100 }) }
  });

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-[760px] px-5 py-16 md:px-10">
        <div className="skeleton mx-auto h-24 w-24 rounded-full" />
        <div className="skeleton mx-auto mt-4 h-8 w-44 rounded" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-[760px] px-5 py-16 md:px-10">
        <Notice tone="error">{t("გამყიდველის პროფილი ვერ მოიძებნა.", "Seller profile could not be found.")}</Notice>
      </div>
    );
  }

  const sellerItems = items?.filter((item) => item.seller.name === profile.fullName) ?? [];

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-8 md:px-10 md:py-12">
      <section className="enter flex flex-col items-center gap-5 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center md:flex-row md:text-left">
        <Avatar
          initials={profile.fullName
            .split(/\s+/)
            .map((p) => p[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
          size="lg"
          testId="img-seller-avatar"
        />
        <div className="flex-1">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
            {t("გამყიდველი", "Seller")}
          </p>
          <h2
            className="font-display mt-1 text-3xl font-semibold tracking-[-.05em]"
            data-testid="text-seller-name"
          >
            {profile.fullName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-[hsl(var(--muted-foreground))] md:justify-start">
            <span className="flex items-center gap-1.5">
              <Star
                size={15}
                className="fill-[hsl(var(--primary))] text-[hsl(var(--primary))]"
              />
              5.0 {t("შეფასება", "Rating")}
            </span>
            {profile.city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} />
                {cityName(profile.city)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Package size={15} />
              {profile.listings} {t("განცხადება", "listings")}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-10">
        <h3 className="font-display text-xl font-semibold">{t("განცხადებები", "Listings")} ({sellerItems.length})</h3>
        {sellerItems.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[hsl(var(--border))] px-6 py-16 text-center">
            <Package size={23} className="mx-auto text-[hsl(var(--muted-foreground))]" />
            <h4 className="font-display mt-4 text-xl font-semibold">
              {t("განცხადებები არ მოიძებნა", "No listings found")}
            </h4>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellerItems.map((item) => (
              <article
                key={item.id}
                className="lift group overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              >
                <Link href={`/listing/${item.id}`} className="block aspect-[1.5]">
                  <ItemVisual
                    src={item.image}
                    title={item.title}
                    className="h-full w-full"
                  />
                </Link>
                <div className="p-4">
                  <div className="flex justify-between gap-3">
                    <Link
                      href={`/listing/${item.id}`}
                      className="truncate text-sm font-semibold"
                    >
                      {item.title}
                    </Link>
                    <span className="font-mono-ui text-xs font-bold">
                      {price(item.price)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                    {cityName(item.city)} · {language === 'en' ? ({ ახალი: 'New', ახალივით: 'Like new', კარგი: 'Good', მეორადი: 'Used' } as Record<string, string>)[item.condition] ?? item.condition : item.condition}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
