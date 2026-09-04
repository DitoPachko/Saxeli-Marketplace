import { Router, type IRouter } from "express";
import {
  CreateItemBody,
  CreateItemResponse,
  GetItemParams,
  GetItemResponse,
  ListItemsQueryParams,
  ListItemsResponse,
  ToggleItemFavoriteParams,
  ToggleItemFavoriteResponse,
} from "@workspace/api-zod";

type MarketplaceItem = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  city: string;
  postedAt: string;
  image: string;
  images: string[];
  description: string;
  seller: {
    name: string;
    initials: string;
    rating: number;
    listings: number;
    responseTime: string;
  };
  isFavorite: boolean;
  delivery: string[];
};

const seller = {
  name: "ნინო ბერიძე",
  initials: "ნბ",
  rating: 4.9,
  listings: 18,
  responseTime: "პასუხობს დაახლოებით 10 წუთში",
};

let items: MarketplaceItem[] = [
  {
    id: "iphone-14-pro",
    title: "iPhone 14 Pro 256GB",
    price: 1890,
    category: "ტექნიკა და ელექტრონიკა",
    condition: "თითქმის ახალი",
    city: "თბილისი",
    postedAt: "დღეს",
    image:
      "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?auto=format&fit=crop&w=1400&q=90",
      "https://images.unsplash.com/photo-1592286927505-2fd0c0c0b6e9?auto=format&fit=crop&w=1400&q=90",
    ],
    description:
      "იდეალურ მდგომარეობაშია, ეკრანზე დამცავი ფირი აკრია. მოყვება ორიგინალი ყუთი და კაბელი.",
    seller,
    isFavorite: false,
    delivery: ["შეხვედრა", "კურიერი"],
  },
  {
    id: "leather-bag",
    title: "ტყავის ჩანთა — იტალიური",
    price: 240,
    category: "ტანსაცმელი და ფეხსაცმელი",
    condition: "ახალი",
    city: "ბათუმი",
    postedAt: "2 საათის წინ",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1400&q=90",
    ],
    description:
      "რბილი ნატურალური ტყავი, უნივერსალური ზომა და მოსახერხებელი შიდა ჯიბეები.",
    seller: { ...seller, name: "მარიამ კ.", initials: "მკ", listings: 7 },
    isFavorite: true,
    delivery: ["კურიერი"],
  },
  {
    id: "film-camera",
    title: "Canon AE-1 ფოტოაპარატი",
    price: 520,
    category: "ჰობი, სპორტი და დასვენება",
    condition: "მეორადი",
    city: "ქუთაისი",
    postedAt: "გუშინ",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=90",
    ],
    description:
      "სრულად შემოწმებული კლასიკური კამერა. მოყვება 50mm ობიექტივი და ჩანთა.",
    seller: { ...seller, name: "ლაშა მ.", initials: "ლმ", rating: 4.8 },
    isFavorite: false,
    delivery: ["შეხვედრა"],
  },
  {
    id: "desk-lamp",
    title: "მინიმალისტური მაგიდის სანათი",
    price: 95,
    category: "სახლი და ინტერიერი",
    condition: "თითქმის ახალი",
    city: "რუსთავი",
    postedAt: "3 დღის წინ",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=90",
    ],
    description:
      "თბილი განათება, მეტალის კორპუსი და ძალიან კარგ მდგომარეობაშია.",
    seller: { ...seller, name: "გიორგი ჩ.", initials: "გჩ", listings: 3 },
    isFavorite: false,
    delivery: ["შეხვედრა", "კურიერი"],
  },
  {
    id: "running-shoes",
    title: "Nike Air Zoom Pegasus",
    price: 180,
    category: "ჰობი, სპორტი და დასვენება",
    condition: "თითქმის ახალი",
    city: "თბილისი",
    postedAt: "4 დღის წინ",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=90",
    ],
    description: "ზომა 41. ორჯერ არის ჩაცმული, პრაქტიკულად ახალია.",
    seller: { ...seller, name: "ანა ს.", initials: "ას", rating: 5 },
    isFavorite: false,
    delivery: ["კურიერი", "შეხვედრა"],
  },
  {
    id: "skincare-set",
    title: "Kiehl's მოვლის ნაკრები",
    price: 130,
    category: "თავის მოვლა და სილამაზე",
    condition: "ახალი",
    city: "ზუგდიდი",
    postedAt: "5 დღის წინ",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1400&q=90",
    ],
    description: "ორიგინალი პროდუქცია, შეფუთვა გახსნილი არ არის.",
    seller: { ...seller, name: "თაკო ბ.", initials: "თბ", listings: 12 },
    isFavorite: false,
    delivery: ["კურიერი"],
  },
  {
    id: "kids-bike",
    title: "ბავშვის ველოსიპედი 16”",
    price: 290,
    category: "საბავშვო სამყარო",
    condition: "მეორადი",
    city: "ფოთი",
    postedAt: "1 კვირის წინ",
    image:
      "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&w=1400&q=90",
    ],
    description: "მსუბუქი ალუმინის ჩარჩო, დამხმარე ბორბლები მოყვება.",
    seller: { ...seller, name: "სალომე კ.", initials: "სკ", listings: 5 },
    isFavorite: false,
    delivery: ["შეხვედრა"],
  },
];

const router: IRouter = Router();

router.get("/items", (req, res) => {
  const parsed = ListItemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "ფილტრის მონაცემები არასწორია" });
    return;
  }

  const { search, category, city, limit } = parsed.data;
  const normalizedSearch = search?.trim().toLocaleLowerCase("ka-GE");
  const filtered = items
    .filter((item) => !category || category === "ყველა ნივთი" || item.category === category)
    .filter((item) => !city || item.city === city)
    .filter(
      (item) =>
        !normalizedSearch ||
        `${item.title} ${item.category} ${item.city}`
          .toLocaleLowerCase("ka-GE")
          .includes(normalizedSearch),
    )
    .slice(0, limit);

  res.json(ListItemsResponse.parse(filtered));
});

router.post("/items", (req, res) => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "განცხადების მონაცემები არასწორია" });
    return;
  }

  const newItem: MarketplaceItem = {
    id: `item-${Date.now()}`,
    ...parsed.data,
    postedAt: "ახლახან",
    images: [parsed.data.image],
    seller: { ...seller, name: "თქვენი პროფილი", initials: "თპ" },
    isFavorite: false,
    delivery: parsed.data.delivery ?? [],
  };
  items = [newItem, ...items];
  res.status(201).json(CreateItemResponse.parse(newItem));
});

router.get("/items/:id", (req, res) => {
  const parsed = GetItemParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ნივთის იდენტიფიკატორი არასწორია" });
    return;
  }
  const item = items.find((candidate) => candidate.id === parsed.data.id);
  if (!item) {
    res.status(404).json({ error: "ნივთი ვერ მოიძებნა" });
    return;
  }
  res.json(GetItemResponse.parse(item));
});

router.post("/items/:id", (req, res) => {
  const parsed = ToggleItemFavoriteParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ნივთის იდენტიფიკატორი არასწორია" });
    return;
  }
  const item = items.find((candidate) => candidate.id === parsed.data.id);
  if (!item) {
    res.status(404).json({ error: "ნივთი ვერ მოიძებნა" });
    return;
  }
  item.isFavorite = !item.isFavorite;
  res.json(ToggleItemFavoriteResponse.parse({ id: item.id, isFavorite: item.isFavorite }));
});

export default router;