import { useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  LoaderCircle,
  X,
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateItem,
  useGetItem,
  getListItemsQueryKey,
  getListMyItemsQueryKey,
  getGetItemQueryKey,
  type ItemInput,
} from "@workspace/api-client-react";
import { Notice, PageHeader } from "@/components/MarketplaceChrome";

const categories = [
  "ტექნიკა და ელექტრონიკა",
  "ტანსაცმელი და ფეხსაცმელი",
  "ავტო / მოტო",
  "ჰობი, სპორტი და დასვენება",
  "სახლი და ინტერიერი",
  "სხვა",
];

const conditions = ["ახალი", "მეორადი (იდეალური)", "მეორადი", "დაზიანებული"];
const cities = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "სხვა"];
const deliveries = ["მიტანა სახლში", "ფოსტით გაგზავნა", "ადგილზე შეხვედრა"];

type Stage = "photo" | "details" | "submitting" | "done";

const emptyForm: ItemInput = {
  title: "",
  price: 0,
  category: "",
  condition: "",
  city: "",
  image: "",
  description: "",
  delivery: [],
};

export default function EditItem() {
  const [match, params] = useRoute("/edit/:id");
  const id = params?.id ?? "";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: itemData, isLoading: isItemLoading, isError: isItemError } = useGetItem(id, {
    query: { enabled: !!id, queryKey: getGetItemQueryKey(id) }
  });

  const [stage, setStage] = useState<Stage>("details");
  const [form, setForm] = useState<ItemInput>(emptyForm);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const updateItem = useUpdateItem();

  useEffect(() => {
    if (itemData) {
      setForm({
        title: itemData.title,
        price: itemData.price,
        category: itemData.category,
        condition: itemData.condition,
        city: itemData.city,
        image: itemData.image,
        description: itemData.description ?? "",
        delivery: itemData.delivery ?? [],
      });
    }
  }, [itemData]);

  if (isItemLoading) {
    return <div className="py-20 text-center"><LoaderCircle className="animate-spin mx-auto" /></div>;
  }
  if (isItemError || !itemData) {
    return <div className="py-20 text-center"><Notice tone="error">ნივთი ვერ მოიძებნა</Notice></div>;
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("გთხოვთ ატვირთოთ მხოლოდ სურათი (JPEG, PNG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm({ ...form, image: base64 });
    };
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.category || !form.condition || !form.city || !form.image) {
      setError("გთხოვთ შეავსოთ ყველა სავალდებულო ველი");
      return;
    }

    setError("");
    setStage("submitting");

    updateItem.mutate(
      {
        id,
        data: {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
        },
      },
      {
        onSuccess: (item) => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMyItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(item.id) });
          setLocation(`/item/${item.id}`);
        },
        onError: () => {
          setError("განცხადების განახლება ვერ მოხერხდა. გთხოვ, თავიდან სცადო.");
          setStage("details");
        }
      },
    );
  };

  return (
    <div>
      <PageHeader title="განცხადების რედაქტირება" eyebrow="Saxeli / ჩემი განცხადებები">
        <Link
          href="/profile"
          className="btn-ink flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
        >
          <ArrowLeft size={16} /> უკან
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-[760px] px-5 py-8 md:px-10 md:py-12">
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-[var(--shadow-sm)]">
          {/* Header indicator */}
          <div className="flex border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)]">
            <button
              onClick={() => setStage("photo")}
              className={`flex-1 py-4 text-sm font-semibold transition ${
                stage === "photo"
                  ? "border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--foreground))]"
                  : "border-b-2 border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              1. ფოტო
            </button>
            <button
              onClick={() => setStage("details")}
              className={`flex-1 py-4 text-sm font-semibold transition ${
                stage === "details"
                  ? "border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--foreground))]"
                  : "border-b-2 border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              2. დეტალები
            </button>
          </div>

          <div className="p-6 md:p-10">
            {error && (
              <div className="mb-6 animate-in slide-in-from-top-2">
                <Notice tone="error">{error}</Notice>
              </div>
            )}

            {stage === "photo" && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-semibold">
                    შეცვალე მთავარი ფოტო
                  </h2>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    კარგი ფოტო უფრო მეტ მყიდველს იზიდავს
                  </p>
                </div>

                {!form.image ? (
                  <div
                    className={`relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-20 transition-all duration-300 ${
                      isDragging
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.05)] scale-[0.98]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)] hover:border-[hsl(var(--primary)/.5)] hover:bg-[hsl(var(--muted))]"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setForm({ ...form, image: event.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="rounded-full bg-[hsl(var(--background))] p-4 shadow-[var(--shadow-sm)]">
                      <ImagePlus size={32} className="text-[hsl(var(--primary))]" />
                    </div>
                    <p className="mt-6 text-base font-semibold">
                      ატვირთე ან ჩააგდე ფოტო
                    </p>
                    <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                      JPEG, PNG • მაქს. 5MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                ) : (
                  <div className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--border))]">
                    <img
                      src={form.image}
                      alt="Uploaded preview"
                      className="aspect-square w-full object-cover sm:aspect-video"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--foreground)/.4)] opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setForm({ ...form, image: "" });
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="flex items-center gap-2 rounded-xl bg-[hsl(var(--background))] px-4 py-2.5 text-sm font-bold shadow-[var(--shadow-lg)] transition hover:scale-105"
                      >
                        <X size={16} /> წაშლა
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    disabled={!form.image}
                    onClick={() => setStage("details")}
                    className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold md:w-auto"
                  >
                    გაგრძელება <ArrowLeft size={16} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {stage === "details" && (
              <form onSubmit={submit} className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      რას ყიდი? <span className="text-[hsl(var(--destructive))]">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="მაგ: iPhone 13 Pro 256GB"
                      className="w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 outline-none transition focus:border-[hsl(var(--primary))]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      ფასი (₾) <span className="text-[hsl(var(--destructive))]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-ui font-bold text-[hsl(var(--muted-foreground))]">
                        ₾
                      </span>
                      <input
                        required
                        type="number"
                        min="0"
                        value={form.price || ""}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full rounded-xl border border-[hsl(var(--input))] bg-transparent py-3.5 pl-10 pr-4 font-mono-ui text-lg font-bold outline-none transition focus:border-[hsl(var(--primary))]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        კატეგორია <span className="text-[hsl(var(--destructive))]">*</span>
                      </label>
                      <select
                        required
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 outline-none transition focus:border-[hsl(var(--primary))]"
                      >
                        <option value="" disabled>აირჩიე</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        მდგომარეობა <span className="text-[hsl(var(--destructive))]">*</span>
                      </label>
                      <select
                        required
                        value={form.condition}
                        onChange={(e) => setForm({ ...form, condition: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 outline-none transition focus:border-[hsl(var(--primary))]"
                      >
                        <option value="" disabled>აირჩიე</option>
                        {conditions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      ქალაქი <span className="text-[hsl(var(--destructive))]">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {cities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setForm({ ...form, city })}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            form.city === city
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/.5)]"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      მიტანის ვარიანტები
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {deliveries.map((delivery) => (
                        <button
                          key={delivery}
                          type="button"
                          onClick={() => {
                            const current = form.delivery || [];
                            const next = current.includes(delivery)
                              ? current.filter((d) => d !== delivery)
                              : [...current, delivery];
                            setForm({ ...form, delivery: next });
                          }}
                          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                            form.delivery?.includes(delivery)
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/.5)]"
                          }`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
                              form.delivery?.includes(delivery)
                                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                                : "border-[hsl(var(--muted-foreground))]"
                            }`}
                          >
                            {form.delivery?.includes(delivery) && (
                              <Check size={12} className="text-[hsl(var(--background))]" strokeWidth={3} />
                            )}
                          </div>
                          {delivery}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center justify-between text-sm font-semibold">
                      <span>აღწერა</span>
                      <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                        არაა სავალდებულო
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="დამატებითი დეტალები ნივთის შესახებ..."
                      className="w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 text-sm outline-none transition focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                </div>

                <div className="mt-10 border-t border-[hsl(var(--border))] pt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setStage("photo")}
                    className="btn-ink rounded-xl px-5 py-3.5 font-bold"
                  >
                    უკან
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-bold shadow-[var(--shadow-md)]"
                  >
                    შენახვა
                  </button>
                </div>
              </form>
            )}

            {stage === "submitting" && (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95">
                <LoaderCircle size={40} className="animate-spin text-[hsl(var(--primary))]" />
                <h2 className="font-display mt-6 text-2xl font-semibold">
                  ინახება...
                </h2>
                <p className="mt-2 text-[hsl(var(--muted-foreground))]">
                  გთხოვთ დაელოდოთ
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}