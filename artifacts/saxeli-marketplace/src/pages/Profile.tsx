import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ListPlus, Settings, Save, MapPin, Package, Edit, Trash2 } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    city: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        toast({ title: "პროფილი განახლდა", description: "მონაცემები წარმატებით შეინახა." });
      },
      onError: () => {
        toast({ title: "შეცდომა", description: "პროფილის განახლება ვერ მოხერხდა.", variant: "destructive" });
      },
    },
  });

  const deleteItemMutation = useDeleteItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMyItemsQueryKey() });
        toast({ title: "განცხადება წაიშალა" });
      },
      onError: () => {
        toast({ title: "შეცდომა", description: "წაშლა ვერ მოხერხდა.", variant: "destructive" });
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

  const loading = profileLoading || itemsLoading;

  if (loading) return <ProfileLoading />;
  if (isError) {
    return (
      <div className="mx-auto max-w-[760px] px-5 py-16 md:px-10">
        <Notice tone="error">პროფილის ჩატვირთვა ვერ მოხერხდა.</Notice>
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
      <PageHeader title="ჩემი Saxeli" eyebrow="პირადი სივრცე">
        <Link
          href="/sell"
          className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
        >
          <ListPlus size={16} /> ახალი განცხადება
        </Link>
      </PageHeader>
      
      <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10 md:py-10 grid gap-10 md:grid-cols-[380px_1fr]">
        <aside>
          <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar initials={initials} size="lg" src={profile?.avatarUrl ?? undefined} />
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
                  მოგესალმები
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
                    სახელი და გვარი
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
                    ტელეფონი
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
                    ქალაქი
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
                    {updateProfileMutation.isPending ? "ინახება..." : <><Save size={15} /> შენახვა</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-ink px-4 rounded-xl text-sm font-bold"
                  >
                    გაუქმება
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-[hsl(var(--muted-foreground))]" />
                  <span>{profile?.city || "არ არის მითითებული"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[hsl(var(--muted-foreground))] font-mono-ui font-semibold">📞</span>
                  <span>{profile?.phoneNumber || "არ არის მითითებული"}</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-semibold transition hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.05)]"
                >
                  <Settings size={15} /> პროფილის რედაქტირება
                </button>
              </div>
            )}
          </div>
        </aside>

        <main>
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-display text-2xl font-semibold">ჩემი განცხადებები</h3>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[hsl(var(--accent)/.16)] px-2 font-mono-ui text-[11px] font-bold">
              {items.length}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-16 text-center">
              <Package size={32} className="mx-auto text-[hsl(var(--muted-foreground))]" />
              <h4 className="font-display mt-4 text-xl font-semibold">ჯერ არც ერთი განცხადება არ გაქვს.</h4>
              <Link
                href="/sell"
                className="btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
              >
                დაამატე პირველი განცხადება
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                >
                  <Link href={`/item/${item.id}`} className="block aspect-[1.3] relative">
                    <ItemVisual src={item.image} title={item.title} className="h-full w-full" />
                    <div className="absolute left-3 top-3 rounded-full bg-[hsl(var(--card)/.88)] px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-[.12em] backdrop-blur-sm">
                      {item.condition}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/item/${item.id}`} className="block truncate text-sm font-semibold mb-1">
                      {item.title}
                    </Link>
                    <p className="font-mono-ui text-sm font-bold text-[hsl(var(--primary))]">
                      {price(item.price)}
                    </p>
                    
                    <div className="mt-4 flex gap-2 border-t border-[hsl(var(--border))] pt-4">
                      <Link 
                        href={`/edit/${item.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--border))] py-2 text-xs font-semibold hover:bg-[hsl(var(--muted))]"
                      >
                        <Edit size={14} /> შეცვლა
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("ნამდვილად გსურთ წაშლა?")) {
                            deleteItemMutation.mutate({ id: item.id });
                          }
                        }}
                        disabled={deleteItemMutation.isPending}
                        className="flex items-center justify-center rounded-lg border border-[hsl(var(--destructive)/.3)] text-[hsl(var(--destructive))] px-3 py-2 hover:bg-[hsl(var(--destructive)/.1)]"
                        title="წაშლა"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}