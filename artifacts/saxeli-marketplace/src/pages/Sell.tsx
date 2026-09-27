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
import { useLanguage } from "@/hooks/use-language";

const conditions = ["ახალი", "თითქმის ახალი", "მეორადი", "ნაწილებად"];
const maxPhotos = 5;
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
  negotiable: z.boolean(),
  tradeAvailable: z.boolean(),
  deliveryAvailable: z.boolean(),
  chatOnly: z.boolean(),
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
type ListingPhoto = {
  id: string;
  file: File;
  preview: string;
  isCover: boolean;
};

export default function Sell() {
  const { t, language, cityName } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { categories } = useCategoryTree();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<ListingPhoto[]>([]);
  const [stage, setStage] = useState<Stage>("photo");
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [error, setError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const createItem = useCreateItem();
  const analyzeItem = useAnalyzeItemImage();

  const update = <K extends keyof ListingForm>(key: K, value: ListingForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  photosRef.current = photos;

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, []);

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

  const readCoverImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = typeof reader.result === "string" ? reader.result : "";
      if (!image) {
        setError(t("მთავარი ფოტოს წაკითხვა ვერ მოხერხდა. სცადე თავიდან.", "Failed to read cover photo. Please try again."));
        return;
      }
      update("image", image);
      setError("");
    };
    reader.onerror = () => setError(t("მთავარი ფოტოს წაკითხვა ვერ მოხერხდა. სცადე თავიდან.", "Failed to read cover photo. Please try again."));
    reader.readAsDataURL(file);
  };

  const readPhoto = (files: File[]) => {
    const availableSlots = maxPhotos - photos.length;
    if (!files.length) return;
    if (availableSlots <= 0) {
      setError(t("მაქსიმუმ 5 ფოტოს ატვირთვა შეგიძლია.", "You can upload a maximum of 5 photos."));
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      setError(t("გთხოვ, ატვირთე ფოტო JPG, PNG ან WEBP ფორმატში.", "Please upload photos in JPG, PNG, or WEBP format."));
      return;
    }

    const filesToAdd = imageFiles.slice(0, availableSlots);
    if (imageFiles.length > availableSlots) {
      setError(t("მაქსიმუმ 5 ფოტოს ატვირთვა შეგიძლია. ზედმეტი ფოტოები არ დაემატა.", "Maximum 5 photos. Extra photos were ignored."));
    } else {
      setError("");
    }

    const firstPhoto = photos.length === 0;
    const newPhotos = filesToAdd.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      isCover: firstPhoto && index === 0,
    }));

    setPhotos((current) => [...current, ...newPhotos].slice(0, maxPhotos));
    setAiFilled(false);
    if (firstPhoto && newPhotos[0]) {
      readCoverImage(newPhotos[0].file);
    }
  };

  const setCoverPhoto = (id: string) => {
    const selected = photos.find((photo) => photo.id === id);
    if (!selected) return;
    setPhotos((current) =>
      current.map((photo) => ({ ...photo, isCover: photo.id === id })),
    );
    readCoverImage(selected.file);
  };

  const removePhoto = (id: string) => {
    const removed = photos.find((photo) => photo.id === id);
    if (!removed) return;
    const remaining = photos.filter((photo) => photo.id !== id);
    URL.revokeObjectURL(removed.preview);

    if (removed.isCover && remaining[0]) {
      remaining[0].isCover = true;
      readCoverImage(remaining[0].file);
    }
    setPhotos(remaining);
    if (!remaining.length) {
      update("image", "");
    }
    setError("");
  };

  const continueToChoice = () => {
    if (!photos.length) {
      setError(t("გთხოვ, ატვირთე მინიმუმ ერთი ფოტო.", "Please upload at least one photo."));
      return;
    }
    setError("");
    setStage("choice");
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
      setError(t("AI ანალიზი ვერ შესრულდა. მონაცემები შეგიძლია ხელით შეავსო.", "AI analysis failed. You can fill data manually."));
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
      setError(t("განცხადების გამოსაქვეყნებლად ნივთის ფოტო ატვირთე.", "Upload a photo to publish the listing."));
      return;
    }

    const validation = listingDetailsSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? t("შეამოწმე შევსებული ველები.", "Please check the filled fields."));
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
          district: validation.data.district,
          image: form.image,
          delivery: form.delivery,
          negotiable: validation.data.negotiable,
          tradeAvailable: validation.data.tradeAvailable,
          deliveryAvailable: validation.data.deliveryAvailable,
          phone: validation.data.phone || null,
          chatOnly: validation.data.chatOnly,
        },
      },
      {
        onSuccess: (item) => {
          window.localStorage.removeItem("saxeli-create-listing-draft");
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMyItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProfileSummaryQueryKey() });
          setLocation(`/listing/${item.id}`);
        },
        onError: () =>
          setError(t("განცხადების გამოქვეყნება ვერ მოხერხდა. გთხოვ, თავიდან სცადო.", "Failed to publish listing. Please try again.")),
      },
    );
  };

  const saveDraft = () => {
    try {
      window.localStorage.setItem("saxeli-create-listing-draft", JSON.stringify(form));
      setDraftSaved(true);
      setError("");
    } catch {
      setError(t("პროექტის შენახვა ვერ მოხერხდა. სცადე თავიდან.", "Failed to save draft. Please try again."));
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
      <PageHeader title={t("განცხადების დამატება", "Add listing")} eyebrow={t("Koneba / ნივთი", "Koneba / Item")}>
        <Link
          href="/"
          className="hidden items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] sm:flex"
          data-testid="link-cancel-sell"
        >
          <X size={16} /> {t("გაუქმება", "Cancel")}
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-[920px] px-3 py-6 sm:px-5 sm:py-8 md:px-10 md:py-12">
        <div className="mb-9 flex items-center gap-3">
          {[
            [(language === "ka" ? "ფოტო" : "Photo"), stage !== "photo"],
            [(language === "ka" ? "არჩევანი" : "Choice"), stage === "details"],
            [(language === "ka" ? "მონაცემები" : "Details"), stage === "details"],
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
          <section className="relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:rounded-3xl sm:p-5 md:p-8">
            {error ? <Notice tone="error">{error}</Notice> : null}

            {stage === "photo" ? (
              <div className="enter space-y-7">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
                    {t("01 / ნივთის ფოტო", "01 / Item photo")}
                  </p>
                  <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-.05em]">
                    {t("ჯერ ფოტო, შემდეგ ყველაფერი დანარჩენი.", "Photo first, everything else after.")}
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {t("კარგი ფოტო გვეხმარება განცხადება სწრაფად და ზუსტად მოვამზადოთ.", "A good photo helps us prepare the listing quickly and accurately.")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-xs font-semibold">
                    {t("ფოტოები:", "Photos:")} {photos.length} / {maxPhotos}
                  </span>
                  {photos.length ? (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {t("მთავარია: ფოტო", "Cover: photo")} {photos.findIndex((photo) => photo.isCover) + 1}
                    </span>
                  ) : null}
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
                    readPhoto(Array.from(event.dataTransfer.files));
                  }}
                   className={`flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition sm:min-h-[230px] sm:px-8 ${
                    isDragging
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)] hover:border-[hsl(var(--primary)/.7)] hover:bg-[hsl(var(--primary)/.06)]"
                  }`}
                  data-testid="dropzone-sell-photo"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]">
                    <UploadCloud size={26} />
                  </span>
                  <span className="mt-4 text-lg font-semibold">
                    {photos.length ? t("დაამატე კიდევ ფოტო", "Add more photos") : t("ატვირთე ნივთის ფოტო", "Upload item photo")}
                  </span>
                  <span className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    {t("ჩააგდე აქ ან აირჩიე მოწყობილობიდან", "Drop here or choose from device")}
                  </span>
                  <span className="mt-3 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">
                    {t("JPG · PNG · WEBP · მაქს. 5 ფოტო", "JPG · PNG · WEBP · Max 5 photos")}
                  </span>
                </button>

                {photos.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className={`group relative overflow-hidden rounded-2xl border-2 transition ${
                          photo.isCover
                            ? "border-[hsl(var(--primary))] shadow-[0_0_0_2px_hsl(var(--primary)/.15)]"
                            : "border-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCoverPhoto(photo.id)}
                          className="relative block aspect-square w-full overflow-hidden bg-[hsl(var(--muted))] text-left"
                          aria-label={`${index + 1}-ე ფოტოს მთავარ ფოტოდ არჩევა`}
                        >
                          <img
                            src={photo.preview}
                            alt={`ნივთის ფოტო ${index + 1}`}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          {photo.isCover ? (
                            <span className="absolute bottom-2 left-2 rounded-full bg-[hsl(var(--primary))] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--primary-foreground))]">
                              {t("მთავარი ფოტო", "Cover photo")}
                            </span>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          aria-label={`${index + 1}-ე ფოტოს წაშლა`}
                          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80 sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {photos.length ? (
                  <button
                    type="button"
                    onClick={continueToChoice}
                    className="btn-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
                    data-testid="button-continue-photos"
                  >
                    {t("ფოტოების დადასტურება", "Confirm photos")} <Check size={16} />
                  </button>
                ) : null}
              </div>
            ) : null}

            {stage === "choice" ? (
              <div className="enter space-y-7">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">
                    {t("02 / სწრაფი დახმარება", "02 / Quick help")}
                  </p>
                  <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-.05em]">
                    {t("როგორ შევავსოთ ნივთი?", "How to fill in the item?")}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {t("ფოტო ატვირთულია. აირჩიე, გინდა თუ არა ხელოვნური ინტელექტის დახმარება.", "Photo uploaded. Choose if you want AI assistance.")}
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
                      {t("ფოტო მზად არის", "Photo is ready")}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-12 rounded-lg px-3 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))] hover:underline"
                    >
                      {t("სხვა ფოტოს არჩევა", "Choose another photo")}
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
                      <span className="block font-semibold">{t("დაიხმარე ხელოვნური ინტელექტი", "Use Artificial Intelligence")}</span>
                      <span className="mt-1 block text-xs font-normal opacity-75">
                        {t("ფოტო შეავსებს ძირითად ველებს", "Photo will fill the main fields")}
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
                      <span className="block font-semibold">{t("ჩაწერე მონაცემები", "Fill in manually")}</span>
                      <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
                        {t("ყველაფერი თავად შეავსე", "Fill everything yourself")}
                      </span>
                    </span>
                  </button>
                </div>

                {isAnalyzing ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-[hsl(var(--card)/.92)] p-8 backdrop-blur-sm">
                    <div className="text-center">
                      <LoaderCircle className="mx-auto animate-spin text-[hsl(var(--primary))]" size={30} />
                      <p className="mt-4 font-semibold">{t("სურათი ანალიზდება...", "Analyzing image...")}</p>
                      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                        {t("რამდენიმე წამში საწყის მონაცემებს მოგიმზადებთ", "We will prepare initial data in a few seconds")}
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
                      {t("03 / ნივთის მონაცემები", "03 / Item data")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-3xl font-semibold tracking-[-.05em]">
                        {t("შეამოწმე და გამოაქვეყნე.", "Check and publish.")}
                      </h2>
                      {aiFilled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--primary)/.14)] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--primary))]">
                          <Sparkles size={12} /> {t("AI-ით შევსებული", "Filled by AI")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {t("ყველა ველი სრულად რედაქტირებადია — შენ უკეთ იცი შენი ნივთი.", "All fields are fully editable — you know your item better.")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStage("choice")}
                    className="hidden items-center gap-2 text-xs font-semibold text-[hsl(var(--primary))] sm:flex"
                  >
                    <ArrowLeft size={14} /> {t("არჩევანის შეცვლა", "Change choice")}
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
                         className="absolute bottom-2 left-2 min-h-12 rounded-lg bg-[hsl(var(--card)/.9)] px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur"
                    >
                      {t("ფოტოს შეცვლა", "Change photo")}
                    </button>
                  </div>
                  <div className="space-y-5">
                    <label className="block text-sm font-semibold">
                      {t("სათაური", "Title")}
                      <input
                        value={form.title}
                        onChange={(event) => update("title", event.target.value)}
                         className="mt-2 min-h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 text-base outline-none transition focus:border-[hsl(var(--primary))] md:text-sm"
                       placeholder={t("მაგ. iPhone 13 Pro 128GB", "e.g. iPhone 13 Pro 128GB")}
                        data-testid="input-sell-title"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold">
                        {t("კატეგორია", "Category")} <span className="text-[hsl(var(--destructive))]">*</span>
                        <div className="mt-2">
                          <CategoryPicker value={form.category} onChange={(slug) => update("category", slug)} />
                        </div>
                      </label>
                      <label className="block text-sm font-semibold">
                        {t("მდგომარეობა", "Condition")}
                        <select
                          value={form.condition}
                          onChange={(event) => update("condition", event.target.value)}
                           className="mt-2 min-h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3.5 text-base outline-none focus:border-[hsl(var(--primary))] md:text-sm"
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
                    {t("სავარაუდო ფასი (₾)", "Estimated price (₾)")}
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.price || ""}
                      onChange={(event) => update("price", Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 font-mono-ui text-lg outline-none focus:border-[hsl(var(--primary))]"
                      placeholder={t("მაგ. 850", "e.g. 850")}
                      data-testid="input-sell-price"
                    />
                  </label>
                  <div>
                    <p className="text-sm font-semibold">{t("ფასისა და გაცვლის პირობები", "Price and trade conditions")}</p>
                    <div className="mt-2 flex gap-2">
                      {[
                        ["negotiable", language === "ka" ? "ფასი შეთანხმებით" : "Negotiable"],
                        ["tradeAvailable", language === "ka" ? "გაცვლა" : "Trade"],
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
                    {t("ქალაქი", "City")}
                    <select
                      value={form.city}
                      onChange={(event) => selectCity(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]"
                      data-testid="select-sell-city"
                    >
                      {cities.map((city) => (
                        <option key={cityName(city)}>{cityName(city)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">
                    {t("უბანი / რაიონი", "District / Region")}
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
                  {t("აღწერა", "Description")}
                  <textarea
                    value={form.description}
                    onChange={(event) => update("description", event.target.value)}
                    rows={5}
                    className="mt-2 w-full resize-none rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3.5 text-sm leading-relaxed outline-none focus:border-[hsl(var(--primary))]"
                     placeholder={t("აღწერეთ ნივთის მდგომარეობა და დეტალები...", "Describe item condition and details...")}
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
                      <span className="block text-sm font-semibold">{t("მიტანის სერვისი", "Delivery service")}</span>
                      <span className="mt-1 block text-xs font-normal leading-relaxed text-[hsl(var(--muted-foreground))]">
                        {t("გაქვთ თუ არა ნივთის ადგილზე მიტანის ან ფოსტით გაგზავნის სერვისი?", "Do you offer delivery or shipping service?")}
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
                      const translatedValue = language === "en" ? ({ "ადგილზე გატანა": "Pick up", "საკურიერო მომსახურება": "Courier service", "პირისპირ შეხვედრა": "Meet in person" } as Record<string, string>)[value] ?? value : value;
                      const translatedDetail = language === "en" ? ({ "მყიდველი ნივთს შენგან იღებს": "Buyer picks up the item", "მყიდველი ირჩევს კურიერს": "Buyer chooses a courier", "შეხვედრა თქვენთვის მოსახერხებელ ადგილას": "Meeting at a convenient place" } as Record<string, string>)[detail] ?? detail : detail;
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
                            <span className="block text-sm font-semibold">{translatedValue}</span>
                            <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
                              {translatedDetail}
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
                    {t("ტელეფონის ნომერი", "Phone number")}
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
                    {t("მხოლოდ ჩატში მოწერა", "Chat only")}
                  </label>
                </div>
                {draftSaved ? (
                  <Notice tone="success">{t("პროექტი შენახულია ამ მოწყობილობაზე.", "Draft saved on this device.")}</Notice>
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
                  <ArrowLeft size={16} /> {t("უკან", "Back")}
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-semibold transition hover:border-[hsl(var(--primary)/.6)] hover:bg-[hsl(var(--muted))]"
                  data-testid="button-save-draft"
                >
                  {t("პროექტად შენახვა", "Save draft")}
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={createItem.isPending}
                  className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
                  data-testid="button-publish-item"
                >
                  {createItem.isPending ? t("იტვირთება...", "Publishing...") : t("გამოქვეყნება", "Publish")}{" "}
                  <Check size={16} />
                </button>
              </div>
            ) : null}
          </section>

          <aside className="hidden space-y-4 lg:block">
            <div className="rounded-2xl bg-[hsl(var(--primary)/.16)] p-5">
              <Sparkles size={18} />
              <h3 className="font-display mt-4 text-lg font-semibold">{t("პატარა რჩევა", "A little tip")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("ნათელი ფოტო და გულწრფელი აღწერა ნივთს უფრო სწრაფად იპოვის ახალ მფლობელს.", "A clear photo and honest description will find a new owner faster.")}
              </p>
            </div>
            <p className="px-2 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
              {t("AI-ს მიერ მომზადებული მონაცემები ყოველთვის გადაამოწმე გამოქვეყნებამდე.", "Always verify AI-generated data before publishing.")}
            </p>
          </aside>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          readPhoto(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
        data-testid="input-sell-photo"
      />
    </div>
  );
}
