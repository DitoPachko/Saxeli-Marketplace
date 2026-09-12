import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  LoaderCircle,
  Package,
  Sparkles,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  useAnalyzeItemImage,
  useCreateItem,
  getListItemsQueryKey,
  getListMyItemsQueryKey,
  getGetProfileSummaryQueryKey,
  type ItemInput,
} from "@workspace/api-client-react";
import { Notice, PageHeader } from "@/components/MarketplaceChrome";
import { CategoryPicker } from "@/components/CategoryPicker";
import { useCategoryTree } from "@/hooks/use-categories";

const conditions = ["ახალი", "თითქმის ახალი", "მეორადი", "ნაწილებად"];
const cities = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი"];
const districtsByCity: Record<string, string[]> = {
  თბილისი: ["ვაკე", "საბურთალო", "ვერა", "დიდუბე", "ჩუღურეთი", "ისანი", "სამგორი", "გლდანი", "ნაძალადევი", "მთაწმინდა"],
  ბათუმი: ["ძველი ბათუმი", "ახალი ბათუმი", "ანგისა", "ბონი-გოროდოკი"],
  ქუთაისი: ["ცენტრი", "ავანგარდი", "ნიკეა", "საფიჩხია"],
  რუსთავი: ["ძველი რუსთავი", "ახალი რუსთავი", "მესხიშვილი"],
  გორი: ["ცენტრი", "ვერხვები", "სადგურის უბანი"],
  ზუგდიდი: ["ცენტრი", "ბარამიას ქუჩა", "სოხუმის ქუჩა"],
};
const deliveryOptions = [
  {
    value: "ადგილზე გატანა",
    detail: "მყიდველი ნივთს შენგან იღებს",
    icon: Package,
  },
  {
    value: "საკურიერო მომსახურება",
    detail: "მყიდველი ირჩევს კურიერს",
    icon: Truck,
  },
  {
    value: "პირისპირ შეხვედრა",
    detail: "შეხვედრა თქვენთვის მოსახერხებელ ადგილას",
    icon: Sparkles,
  },
];

const listingDetailsSchema = z.object({
  title: z.string().trim().min(2, "სათაური მინიმუმ 2 სიმბოლოსგან უნდა შედგებოდეს."),
  category: z.string().min(1, "აირჩიე კატეგორია."),
  condition: z.enum(["ახალი", "თითქმის ახალი", "მეორადი", "ნაწილებად"]),
  price: z.number().finite().positive("ფასი 0-ზე მეტი უნდა იყოს."),
  city: z.string().min(1, "აირჩიე ქალაქი."),
  district: z.string().min(1, "აირჩიე უბანი ან რაიონი."),
  description: z.string().trim().min(10, "აღწერა მინიმუმ 10 სიმბოლოსგან უნდა შედგებოდეს."),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || /^(?:\+995|0)?5\d{8}$/.test(value.replace(/[\s()-]/g, "")), {
      message: "შეიყვანე სწორი ქართული მობილურის ნომერი.",
    }),
});

type ListingForm = ItemInput & {
  district: string;
  negotiable: boolean;
  tradeAvailable: boolean;
  deliveryAvailable: boolean;
  phone: string;
  chatOnly: boolean;
};

const emptyForm: ListingForm = {
  title: "",
  price: 0,
  category: "",
  condition: conditions[1],
  city: "თბილისი",
  district: districtsByCity["თბილისი"][0],
  image: "",
  description: "",
  delivery: [],
  negotiable: false,
  tradeAvailable: false,
  deliveryAvailable: false,
  phone: "",
  chatOnly: false,
};

type Stage = "photo" | "choice" | "details";

export default function Sell() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { categories } = useCategoryTree();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("photo");
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [error, setError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const createItem = useCreateItem();
  const analyzeItem = useAnalyzeItemImage();

  const update = <K extends keyof ListingForm>(key: K, value: ListingForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("saxeli-create-listing-draft");
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<ListingForm>;
      if (parsed.image || parsed.title || parsed.description) {
        setForm((current) => ({ ...current, ...parsed }));
        setStage("details");
        setDraftSaved(true);
      }
    } catch {
      window.localStorage.removeItem("saxeli-create-listing-draft");
    }
  }, []);

  const readPhoto = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("გთხოვ, ატვირთე ფოტო JPG, PNG ან WEBP ფორმატში.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = typeof reader.result === "string" ? reader.result : "";
      if (!image) {
        setError("ფოტოს წაკითხვა ვერ მოხერხდა. სცადე თავიდან.");
        return;
      }
      update("image", image);
      setAiFilled(false);
      setError("");
      setStage("choice");
    };
    reader.onerror = () => setError("ფოტოს წაკითხვა ვერ მოხერხდა. სცადე თავიდან.");
    reader.readAsDataURL(file);
  };

  const chooseAi = async () => {
    if (!form.image) return;
    setError("");
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeItem.mutateAsync({
        data: { image: form.image },
      });
      
      const match = categories.find(c => c.name.toLowerCase() === analysis.category.toLowerCase() || c.slug.toLowerCase() === analysis.category.toLowerCase());
      const catSlug = match?.slug ?? 'electronics';

      setForm((current) => ({
        ...current,
        title: analysis.title,
        category: catSlug,
        price: analysis.estimatedPrice,
        description: analysis.description,
      }));
      setAiFilled(true);
      setStage("details");
    } catch {
      setError("AI ანალიზი ვერ შესრულდა. მონაცემები შეგიძლია ხელით შეავსო.");
      setAiFilled(false);
      setStage("details");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chooseManual = () => {
    setError("");
    setAiFilled(false);
    setStage("details");
  };

  const toggleDelivery = (value: string) => {
    const current = form.delivery ?? [];
    update(
      "delivery",
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const submit = () => {
    if (!form.image) {
      setError("განცხადების გამოსაქვეყნებლად ნივთის ფოტო ატვირთე.");
      return;
    }

    const validation = listingDetailsSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "შეამოწმე შევსებული ველები.");
      return;
    }

    setError("");
    createItem.mutate(
      {
        data: {
          title: validation.data.title,
          description: validation.data.description,
          price: validation.data.price,
          category: validation.data.category,
          condition: validation.data.condition,
          city: validation.data.city,
          image: form.image,
          delivery: form.delivery,
        },
      },
      {
        onSuccess: (item) => {
          window.localStorage.removeItem("saxeli-create-listing-draft");
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMyItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProfileSummaryQueryKey() });
          setLocation(`/item/${item.id}`);
        },
        onError: () =>
          setError("განცხადების გამოქვეყნება ვერ მოხერხდა. გთხოვ, თავიდან სცადო."),
      },
    );
  };

  const saveDraft = () => {
    try {
      window.localStorage.setItem("saxeli-create-listing-draft", JSON.stringify(form));
      setDraftSaved(true);
      setError("");
    } catch {
      setError("პროექტის შენახვა ვერ მოხერხდა. სცადე თავიდან.");
    }
  };

  const selectCity = (city: string) => {
    update("city", city);
    update("district", districtsByCity[city]?.[0] ?? "");
  };

  const toggleDeliveryAvailable = () => {
    const next = !form.deliveryAvailable;
    update("deliveryAvailable", next);
    if (next && !form.delivery?.length) {
      update("delivery", ["საკურიერო მომსახურება"]);
    }
    if (!next) {
      update("delivery", []);
    }
  };

  return (
    <div>
      <PageHeader title="განცხადების დამატება" eyebrow="Saxeli / ნივთი">
        <Link
          href="/"
          className="hidden items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] sm:flex"
          data-testid="link-cancel-sell"
        >
          <X size={16} /> გაუქმება
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-[920px] px-5 py-8 md:px-10 md:py-12">
        <div className="mb-9 flex items-center gap-3">
          {[
            ["ფოტო", stage !== "photo"],
            ["არჩევანი", stage === "details"],
            ["მონაცემები", stage === "details"],
          ].map(([label, complete], index) => (
            <div key={label as string} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono-ui text-xs ${
                  complete || (index === 0 && stage === "photo")
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                }`}
              >
                {complete ? <Check size={15} /> : index + 1}
              </span>
              <span
                className={`hidden truncate text-xs font-semibold sm:block ${
                  (index === 0 && stage === "photo") ||
                  (index === 1 && stage === "choice") ||
                  (index === 2 && stage === "details")
                    ? ""
                    : "text-[hsl(var(--muted-foreground))]"
                }`}
              >
                {label}
              </span>
              {index < 2 ? (
                <span className="mx-1 h-px flex-1 bg-[hsl(var(--border))] sm:mx-4" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <section className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-8">
            {error ? <Notice tone="error">{error}</Notice> : null}

            {stage === "photo" ? (
              <div className="enter space-y-7">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
                    01 / ნივთის ფოტო
                  </p>
                  <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-.05em]">
                    ჯერ ფოტო, შემდეგ ყველაფერი დანარჩენი.
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    კარგი ფოტო გვეხმარება განცხადება სწრაფად და ზუსტად მოვამზადოთ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    readPhoto(event.dataTransfer.files[0]);
                  }}
                  className={`flex min-h-[310px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 text-center transition ${
                    isDragging
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)] hover:border-[hsl(var(--primary)/.7)] hover:bg-[hsl(var(--primary)/.06)]"
                  }`}
                  data-testid="dropzone-sell-photo"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]">
                    <UploadCloud size={28} />
                  </span>
                  <span className="mt-5 text-lg font-semibold">ატვირთე ნივთის ფოტო</span>
                  <span className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    ჩააგდე აქ ან აირჩიე მოწყობილობიდან
                  </span>
                  <span className="mt-4 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">
                    JPG · PNG · WEBP
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => readPhoto(event.target.files?.[0])}
                  data-testid="input-sell-photo"
                />
              </div>
            ) : null}

            {stage === "choice" ? (
              <div className="enter space-y-7">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
                    02 / სწრაფი დახმარება
                  </p>
                  <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-.05em]">
                    როგორ შევავსოთ ნივთი?
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    ფოტო ატვირთულია. აირჩიე, გინდა თუ არა ხელოვნური ინტელექტის დახმარება.
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)]">
                  <img
                    src={form.image}
                    alt="ატვირთული ნივთი"
                    className="h-56 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 p-4">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      ფოტო მზად არის
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-[hsl(var(--primary))] hover:underline"
                    >
                      სხვა ფოტოს არჩევა
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={chooseAi}
                    className="btn-primary flex min-h-28 flex-col items-start justify-between rounded-2xl p-5 text-left"
                    data-testid="button-use-ai"
                  >
                    <Sparkles size={21} />
                    <span>
                      <span className="block font-semibold">დაიხმარე ხელოვნური ინტელექტი</span>
                      <span className="mt-1 block text-xs font-normal opacity-75">
                        ფოტო შეავსებს ძირითად ველებს
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={chooseManual}
                    className="flex min-h-28 flex-col items-start justify-between rounded-2xl border border-[hsl(var(--border))] p-5 text-left transition hover:border-[hsl(var(--primary)/.7)] hover:bg-[hsl(var(--muted)/.5)]"
                    data-testid="button-fill-manually"
                  >
                    <ImagePlus size={21} />
                    <span>
                      <span className="block font-semibold">ჩაწერე მონაცემები</span>
                      <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
                        ყველაფერი თავად შეავსე
                      </span>
                    </span>
                  </button>
                </div>

                {isAnalyzing ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-[hsl(var(--card)/.92)] p-8 backdrop-blur-sm">
                    <div className="text-center">
                      <LoaderCircle className="mx-auto animate-spin text-[hsl(var(--primary))]" size={30} />
                      <p className="mt-4 font-semibold">სურათი ანალიზდება...</p>
                      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                        რამდენიმე წამში საწყის მონაცემებს მოგიმზადებთ
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {stage === "details" ? (
              <div className="enter space-y-7">
                <div className="flex items-start justify-between gap-4">
                   <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
                      03 / ნივთის მონაცემები
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-3xl font-semibold tracking-[-.05em]">
                        შეამოწმე და გამოაქვეყნე.
                      </h2>
                      {aiFilled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary)/.14)] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--primary))]">
                          <Sparkles size={12} /> AI-ით შევსებული
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      ყველა ველი სრულად რედაქტირებადია — შენ უკეთ იცი შენი ნივთი.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStage("choice")}
                    className="hidden items-center gap-2 text-xs font-semibold text-[hsl(var(--primary))] sm:flex"
                  >
                    <ArrowLeft size={14} /> არჩევანის შეცვლა
                  </button>
                </div>

                <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-[hsl(var(--muted))]">
                    {form.image ? (
                      <img src={form.image} alt="ნივთის ფოტო" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImagePlus size={26} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 left-2 rounded-lg bg-[hsl(var(--card)/.9)] px-2 py-1.5 text-[10px] font-semibold shadow-sm backdrop-blur"
                    >
                      ფოტოს შეცვლა
                    </button>
                  </div>
                  <div className="space-y-5">
                    <label className="block text-sm font-semibold">
                      სათაური
                      <input
                        value={form.title}
                        onChange={(event) => update("title", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 text-sm outline-none transition focus:border-[hsl(var(--primary))]"
                       placeholder="მაგ. iPhone 13 Pro 128GB"
                        data-testid="input-sell-title"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold">
                        კატეგორია <span className="text-[hsl(var(--destructive))]">*</span>
                        <div className="mt-2">
                          <CategoryPicker value={form.category} onChange={(slug) => update("category", slug)} />
                        </div>
                      </label>
                      <label className="block text-sm font-semibold">
                        მდგომარეობა
                        <select
                          value={form.condition}
                          onChange={(event) => update("condition", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                          data-testid="select-sell-condition"
                        >
                          {conditions.map((condition) => (
                            <option key={condition}>{condition}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    სავარაუდო ფასი (₾)
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.price || ""}
                      onChange={(event) => update("price", Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 font-mono-ui text-lg outline-none focus:border-[hsl(var(--primary))]"
                      placeholder="მაგ. 850"
                      data-testid="input-sell-price"
                    />
                  </label>
                  <div>
                    <p className="text-sm font-semibold">ფასისა და გაცვლის პირობები</p>
                    <div className="mt-2 flex gap-2">
                      {[
                        ["negotiable", "ფასი შეთანხმებით"],
                        ["tradeAvailable", "გაცვლა"],
                      ].map(([key, label]) => {
                        const selected = form[key as "negotiable" | "tradeAvailable"];
                        return (
                          <label
                            key={key}
                            className={`flex min-h-[52px] flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-xs font-semibold transition ${
                              selected
                                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.12)] text-[hsl(var(--foreground))]"
                                : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/.6)] hover:bg-[hsl(var(--muted))]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => update(key as "negotiable" | "tradeAvailable", event.target.checked)}
                              className="sr-only"
                              data-testid={`checkbox-${key}`}
                            />
                            <span className="flex items-center gap-1.5">
                              {selected ? <Check size={14} /> : null}
                              {label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    ქალაქი
                    <select
                      value={form.city}
                      onChange={(event) => selectCity(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                      data-testid="select-sell-city"
                    >
                      {cities.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">
                    უბანი / რაიონი
                    <select
                      value={form.district}
                      onChange={(event) => update("district", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                      data-testid="select-sell-district"
                    >
                      {(districtsByCity[form.city] ?? []).map((district) => (
                        <option key={district}>{district}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-sm font-semibold">
                  აღწერა
                  <textarea
                    value={form.description}
                    onChange={(event) => update("description", event.target.value)}
                    rows={5}
                    className="mt-2 w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 text-sm leading-relaxed outline-none focus:border-[hsl(var(--primary))]"
                     placeholder="აღწერეთ ნივთის მდგომარეობა და დეტალები..."
                    data-testid="textarea-sell-description"
                  />
                </label>

                <div>
                  <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                    form.deliveryAvailable
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/.6)]"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.deliveryAvailable}
                      onChange={toggleDeliveryAvailable}
                      className="sr-only"
                      data-testid="checkbox-delivery-available"
                    />
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      form.deliveryAvailable
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "bg-[hsl(var(--muted))]"
                    }`}>
                      <Truck size={19} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">მიტანის სერვისი</span>
                      <span className="mt-1 block text-xs font-normal leading-relaxed text-[hsl(var(--muted-foreground))]">
                        გაქვთ თუ არა ნივთის ადგილზე მიტანის ან ფოსტით გაგზავნის სერვისი?
                      </span>
                    </span>
                    <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      form.deliveryAvailable ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--muted-foreground)/.35)]"
                    }`}>
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        form.deliveryAvailable ? "left-6" : "left-1"
                      }`} />
                    </span>
                  </label>
                  {form.deliveryAvailable ? (
                  <div className="mt-3 grid gap-3">
                    {deliveryOptions.map(({ value, detail, icon: Icon }) => {
                      const selected = form.delivery?.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleDelivery(value)}
                          className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)]"
                              : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/.6)]"
                          }`}
                          data-testid={`button-delivery-${value}`}
                        >
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              selected
                                ? "bg-[hsl(var(--primary))]"
                                : "bg-[hsl(var(--muted))]"
                            }`}
                          >
                            <Icon size={19} />
                          </span>
                          <span className="flex-1">
                            <span className="block text-sm font-semibold">{value}</span>
                            <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
                              {detail}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              selected
                                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                                : "border-[hsl(var(--border))]"
                            }`}
                          >
                            {selected ? <Check size={13} /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  ) : null}
                </div>

                <div className="space-y-5">
                  <label className="block text-sm font-semibold">
                    ტელეფონის ნომერი
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                      placeholder="+995 5XX XX XX XX"
                      autoComplete="tel"
                      data-testid="input-sell-phone"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.chatOnly}
                      onChange={(event) => update("chatOnly", event.target.checked)}
                      className="h-5 w-5 accent-[hsl(var(--primary))]"
                      data-testid="checkbox-chat-only"
                    />
                    მხოლოდ ჩატში მოწერა
                  </label>
                </div>
                {draftSaved ? (
                  <Notice tone="success">პროექტი შენახულია ამ მოწყობილობაზე.</Notice>
                ) : null}
              </div>
            ) : null}

            {stage === "details" ? (
              <div className="mt-8 flex justify-between gap-3 border-t border-[hsl(var(--border))] pt-6">
                <button
                  type="button"
                  onClick={() => setStage("choice")}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[hsl(var(--muted))]"
                  data-testid="button-sell-back"
                >
                  <ArrowLeft size={16} /> უკან
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-semibold transition hover:border-[hsl(var(--primary)/.6)] hover:bg-[hsl(var(--muted))]"
                  data-testid="button-save-draft"
                >
                  პროექტად შენახვა
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={createItem.isPending}
                  className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
                  data-testid="button-publish-item"
                >
                  {createItem.isPending ? "იტვირთება..." : "გამოქვეყნება"}{" "}
                  <Check size={16} />
                </button>
              </div>
            ) : null}
          </section>

          <aside className="hidden space-y-4 lg:block">
            <div className="rounded-2xl bg-[hsl(var(--primary)/.16)] p-5">
              <Sparkles size={18} />
              <h3 className="font-display mt-4 text-lg font-semibold">პატარა რჩევა</h3>
              <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                ნათელი ფოტო და გულწრფელი აღწერა ნივთს უფრო სწრაფად იპოვის ახალ მფლობელს.
              </p>
            </div>
            <p className="px-2 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
              AI-ს მიერ მომზადებული მონაცემები ყოველთვის გადაამოწმე გამოქვეყნებამდე.
            </p>
          </aside>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => readPhoto(event.target.files?.[0])}
      />
    </div>
  );
}
