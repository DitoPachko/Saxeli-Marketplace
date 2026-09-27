import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { Camera, ListPlus, Settings, Save, MapPin, Package, Edit, Trash2, Zap, Crown, ArrowUpRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCurrentProfileQueryKey,
  getListMyItemsQueryKey,
  useGetCurrentProfile,
  useUpdateCurrentProfile,
  useListMyItems,
  useDeleteItem,
} from "@workspace/api-client-react";
import type { MarketplaceItem } from "@workspace/api-client-react";
import { Avatar, ItemVisual, Notice, PageHeader } from "@/components/MarketplaceChrome";
import { useToast } from "@/hooks/use-toast";
import { VipModal } from "@/components/VipModal";
import { useLanguage } from "@/hooks/use-language";

function price(value: number) {
  return `${value.toLocaleString("ka-GE")} ₾`;
}

function ProfileLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10">
      <div className="skeleton h-10 w-44 rounded" />
      <div className="mt-8 skeleton h-72 rounded-2xl" />
    </div>
  );
}

export default function Profile() {
  const { t, language, cityName } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    city: "",
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [promotionItem, setPromotionItem] = useState<MarketplaceItem | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  const { data: profile, isLoading: profileLoading, isError } = useGetCurrentProfile({
    query: { queryKey: getGetCurrentProfileQueryKey() },
  });

  const { data: items = [], isLoading: itemsLoading } = useListMyItems({
    query: { queryKey: getListMyItemsQueryKey() },
  });

  const updateProfileMutation = useUpdateCurrentProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentProfileQueryKey() });
        setIsEditing(false);
        toast({ title: t("პროფილი განახლდა", "Profile updated"), description: t("მონაცემები წარმატებით შეინახა.", "Data saved successfully.") });
      },
      onError: () => {
        toast({ title: t("შეცდომა", "Error"), description: t("პროფილის განახლება ვერ მოხერხდა.", "Failed to update profile."), variant: "destructive" });
      },
    },
  });

  const deleteItemMutation = useDeleteItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMyItemsQueryKey() });
        toast({ title: t("განცხადება წაიშალა", "Listing deleted") });
      },
      onError: () => {
        toast({ title: t("შეცდომა", "Error"), description: t("წაშლა ვერ მოხერხდა.", "Failed to delete."), variant: "destructive" });
      },
    },
  });

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        fullName: profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        city: profile.city || "",
      });
    }
  }, [profile, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ data: formData });
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("არასწორი ფაილი", "Invalid file"), description: t("აირჩიე სურათი.", "Choose an image."), variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("ფაილი ძალიან დიდია", "File too large"), description: t("სურათი 5MB-ზე პატარა უნდა იყოს.", "Image must be under 5MB."), variant: "destructive" });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      await user.setProfileImage({ file });
      await user.reload();
      await queryClient.invalidateQueries({ queryKey: getGetCurrentProfileQueryKey() });
      toast({ title: t("პროფილის ფოტო განახლდა", "Profile photo updated") });
    } catch {
      toast({ title: t("შეცდომა", "Error"), description: t("პროფილის ფოტოს შეცვლა ვერ მოხერხდა.", "Failed to update profile photo."), variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const loading = profileLoading || itemsLoading;

  if (loading) return <ProfileLoading />;
  if (isError) {
    return (
      <div className="mx-auto max-w-[760px] px-5 py-16 md:px-10">
        <Notice tone="error">{t("პროფილის ჩატვირთვა ვერ მოხერხდა.", "Failed to load profile.")}</Notice>
      </div>
    );
  }

  const initials = profile?.fullName
    ?.split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "ს";

  return (
    <div>
      <PageHeader title={t("ჩემი ქონება", "My Koneba")} eyebrow={t("პირადი სივრცე", "Personal space")}>
        <Link
          href="/sell"
          className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
        >
          <ListPlus size={16} /> {t("ახალი განცხადება", "New listing")}
        </Link>
      </PageHeader>
      
      <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10 md:py-10 grid gap-10 md:grid-cols-[380px_1fr]">
        <aside>
          <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative shrink-0">
                <Avatar initials={initials} size="lg" src={profile?.avatarUrl ?? undefined} />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  aria-label={t("პროფილის ფოტოს შეცვლა", "Change profile photo")}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[hsl(var(--card))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition hover:scale-105 disabled:cursor-wait disabled:opacity-60"
                >
                  <Camera size={14} />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
                  {t("მოგესალმები", "Welcome")}
                </p>
                <h2 className="font-display mt-1 text-xl font-semibold tracking-[-.02em]">
                  {profile?.fullName}
                </h2>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">
                    {t("სახელი და გვარი", "Full name")}
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">
                    {t("ტელეფონი", "Phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">
                    {t("ქალაქი", "City")}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold"
                  >
                    {updateProfileMutation.isPending ? t("ინახება...", "Saving...") : <><Save size={15} /> {t("შენახვა", "Save")}</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-ink px-4 rounded-xl text-sm font-bold"
                  >
                    {t("გაუქმება", "Cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-[hsl(var(--muted-foreground))]" />
                  <span>{profile?.city ? cityName(profile.city) : t("არ არის მითითებული", "Not provided")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[hsl(var(--muted-foreground))] font-mono-ui font-semibold">📞</span>
                  <span>{profile?.phoneNumber || t("არ არის მითითებული", "Not provided")}</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-semibold transition hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.05)]"
                >
                  <Settings size={15} /> {t("პროფილის რედაქტირება", "Edit profile")}
                </button>
              </div>
            )}
          </div>
        </aside>

        <main>
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-display text-2xl font-semibold">{t("ჩემი განცხადებები", "My listings")}</h3>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[hsl(var(--accent)/.16)] px-2 font-mono-ui text-[11px] font-bold">
              {items.length}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-16 text-center">
              <Package size={32} className="mx-auto text-[hsl(var(--muted-foreground))]" />
              <h4 className="font-display mt-4 text-xl font-semibold">{t("ჯერ არც ერთი განცხადება არ გაქვს.", "You have no listings yet.")}</h4>
              <Link
                href="/sell"
                className="btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
              >
                {t("დაამატე პირველი განცხადება", "Add your first listing")}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const isSuperVip = item.promotionStatus === 'super_vip';
                const isVip = item.promotionStatus === 'vip';
                return (
                <article
                  key={item.id}
                  className={`group overflow-hidden rounded-2xl border bg-[hsl(var(--card))] ${
                    isSuperVip ? "border-[hsl(var(--primary)/.5)] shadow-[0_4px_24px_-8px_hsl(var(--primary)/.25)]" :
                    isVip ? "border-[hsl(var(--accent)/.4)] shadow-[0_4px_24px_-8px_hsl(var(--accent)/.2)]" :
                    "border-[hsl(var(--border))]"
                  }`}
                >
                  <Link href={`/listing/${item.id}`} className="block aspect-[1.3] relative">
                    <ItemVisual src={item.image} title={item.title} className="h-full w-full" />
                    <div className="absolute left-3 top-3 flex flex-col gap-2">
                      {isSuperVip && (
                        <div className="flex items-center gap-1 rounded-full bg-[hsl(var(--primary))] px-2.5 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-[.05em] text-[hsl(var(--primary-foreground))] shadow-sm">
                          <Crown size={12} /> Super VIP
                        </div>
                      )}
                      {isVip && (
                        <div className="flex items-center gap-1 rounded-full bg-[hsl(var(--accent))] px-2.5 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-[.05em] text-[hsl(var(--accent-foreground))] shadow-sm">
                          <Zap size={12} /> VIP
                        </div>
                      )}
                      <div className="inline-block w-fit rounded-full bg-[hsl(var(--card)/.88)] px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-[.12em] backdrop-blur-sm">
                        {language === 'en' ? ({ ახალი: 'New', ახალივით: 'Like new', კარგი: 'Good', მეორადი: 'Used' } as Record<string, string>)[item.condition] ?? item.condition : item.condition}
                      </div>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/listing/${item.id}`} className="block truncate text-sm font-semibold mb-1">
                      {item.title}
                    </Link>
                    <div className="flex items-center justify-between">
                      <p className="font-mono-ui text-sm font-bold text-[hsl(var(--primary))]">
                        {price(item.price)}
                      </p>
                    </div>

                    {(isVip || isSuperVip) && item.vipExpiresAt && (
                      <div className="mt-3 rounded-lg bg-[hsl(var(--muted)/.5)] p-2 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                        {t("აქტიურია:", "Active:")} {new Date(item.vipExpiresAt).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    
                    <div className="mt-4 flex flex-col gap-2 border-t border-[hsl(var(--border))] pt-4">
                      <button
                        type="button"
                        onClick={() => setPromotionItem(item)}
                        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--primary)/.1)] py-2 text-xs font-bold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/.2)]"
                      >
                        <ArrowUpRight size={14} /> {item.promotionStatus === 'standard' ? t("რეკლამირება", "Promote") : t("VIP-ის განახლება", "Renew VIP")}
                      </button>
                      <div className="flex gap-2">
                        <Link
                          href={`/edit/${item.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--border))] py-2 text-xs font-semibold hover:bg-[hsl(var(--muted))]"
                        >
                          <Edit size={14} /> {t("შეცვლა", "Edit")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(t("ნამდვილად გსურთ წაშლა?", "Are you sure you want to delete?"))) {
                              deleteItemMutation.mutate({ id: item.id });
                            }
                          }}
                          disabled={deleteItemMutation.isPending}
                          className="flex items-center justify-center rounded-lg border border-[hsl(var(--destructive)/.3)] text-[hsl(var(--destructive))] px-3 py-2 hover:bg-[hsl(var(--destructive)/.1)]"
                          title={t("წაშლა", "Delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )})}
            </div>
          )}
        </main>
      </div>
      <VipModal item={promotionItem} isOpen={!!promotionItem} onClose={() => setPromotionItem(null)} />
    </div>
  );
}