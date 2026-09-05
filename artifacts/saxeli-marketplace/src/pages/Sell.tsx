import { useRef, useState } from "react";
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
import {
  useAnalyzeItemImage,
  useCreateItem,
  getListItemsQueryKey,
  getListMyItemsQueryKey,
  getGetProfileSummaryQueryKey,
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

const conditions = ["ახალი", "თითქმის ახალი", "მეორადი", "ნაწილებად"];
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

const emptyForm: ItemInput = {
  title: "",
  price: 0,
  category: categories[0],
  condition: conditions[1],
  city: "თბილისი",
  image: "",
  description: "",
  delivery: [],
};

type Stage = "photo" | "choice" | "details";

export default function Sell() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("photo");
  const [form, setForm] = useState<ItemInput>(emptyForm);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [error, setError] = useState("");
  const createItem = useCreateItem();
  const analyzeItem = useAnalyzeItemImage();

  const update = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

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
      setForm((current) => ({
        ...current,
        title: analysis.title,
        category: analysis.category,
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
    if (
      !form.image ||
      !form.title.trim() ||
      !form.description.trim() ||
      !form.price ||
      form.price <= 0
    ) {
      setError("შეავსე სათაური, ფასი და აღწერა, რომ განცხადება გამოაქვეყნო.");
      return;
    }

    setError("");
    createItem.mutate(
      {
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
          queryClient.invalidateQueries({ queryKey: getGetProfileSummaryQueryKey() });
          setLocation(`/item/${item.id}`);
        },
        onError: () =>
          setError("განცხადების დამატება ვერ მოხერხდა. გთხოვ, თავიდან სცადო."),
      },
    );
  };

  return (
    <div>
      <PageHeader title="ნივთის განცხადება" eyebrow="Saxeli / ნივთი">
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
                        placeholder="მაგ. ვინტაჟური კამერა"
                        data-testid="input-sell-title"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold">
                        კატეგორია
                        <select
                          value={form.category}
                          onChange={(event) => update("category", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                          data-testid="select-sell-category"
                        >
                          {categories.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
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
                      placeholder="0"
                      data-testid="input-sell-price"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    ქალაქი
                    <select
                      value={form.city}
                      onChange={(event) => update("city", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                      data-testid="select-sell-city"
                    >
                      {["თბილისი", "ბათუმი", "ქუთაისი", "ზუგდიდი", "რუსთავი", "ფოთი"].map((city) => (
                        <option key={city}>{city}</option>
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
                    placeholder="რა უნდა იცოდეს მომავალმა მფლობელმა?"
                    data-testid="textarea-sell-description"
                  />
                </label>

                <div>
                  <p className="text-sm font-semibold">მიტანა</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    მონიშნე ერთი ან რამდენიმე ვარიანტი.
                  </p>
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
                </div>
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