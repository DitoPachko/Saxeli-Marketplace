import { Router, type IRouter, type Request, type Response } from "express";
import { AnalyzeItemImageBody, AnalyzeItemImageResponse } from "@workspace/api-zod";

type Analysis = {
  title: string;
  category: string;
  condition: string;
  suggested_price_gel: number;
  city: string;
  description: string;
  model: string;
  year: string;
  brand: string;
  color: string;
  keySpecs: string[];
  accessories: string[];
};

const allowedCategories = [
  "ტექნიკა",
  "ტანსაცმელი და ფეხსაცმელი",
  "ჰობი და სპორტი",
  "თავის მოვლა",
  "საბავშვო",
  "სახლი და დეკორი",
];
const allowedConditions = ["ახალი", "თითქმის ახალი", "მეორადი", "ნაწილებისთვის"];
const allowedCities = ["თბილისი", "ბათუმი", "ქუთაისი", "ზუგდიდი", "რუსთავი", "ფოთი"];

const mockAnalysis: Analysis = {
  title: 'Apple MacBook Air 13" M2 (Rose Gold)',
  category: "ტექნიკა",
  condition: "თითქმის ახალი",
  suggested_price_gel: 1850,
  city: "თბილისი",
  description:
    'იყიდება იდეალურ მდგომარეობაში მყოფი MacBook Air M2 (Rose Gold).\n\n• პროცესორი: Apple M2\n• ეკრანი: 13.6" Liquid Retina\n• ფერი: Rose Gold\n\nმოყვება: ორიგინალი დამტენი და ყუთი.',
  model: 'MacBook Air 13" M2',
  year: "2022",
  brand: "Apple",
  color: "Rose Gold",
  keySpecs: ["პროცესორი: Apple M2", 'ეკრანი: 13.6" Liquid Retina', "ფერი: Rose Gold"],
  accessories: ["ორიგინალი დამტენი", "ყუთი"],
};

function normalizeAnalysis(value: unknown): Analysis {
  const candidate = value as Partial<Analysis>;
  const category = allowedCategories.includes(candidate.category ?? "")
    ? candidate.category!
    : "სახლი და დეკორი";
  const condition = allowedConditions.includes(candidate.condition ?? "")
    ? candidate.condition!
    : "მეორადი";
  const city = allowedCities.includes(candidate.city ?? "") ? candidate.city! : "თბილისი";
  const suggestedPrice = Number.isFinite(candidate.suggested_price_gel)
    && Number(candidate.suggested_price_gel) > 0
    ? Math.round(Number(candidate.suggested_price_gel))
    : 0;
  const keySpecs = Array.isArray(candidate.keySpecs)
    ? candidate.keySpecs.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
  const accessories = Array.isArray(candidate.accessories)
    ? candidate.accessories.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];

  if (
    typeof candidate.title !== "string" ||
    candidate.title.trim().length < 5 ||
    !suggestedPrice ||
    typeof candidate.description !== "string" ||
    typeof candidate.model !== "string" ||
    typeof candidate.year !== "string" ||
    typeof candidate.brand !== "string" ||
    typeof candidate.color !== "string"
  ) {
    throw new Error("AI response is missing listing fields");
  }

  return {
    title: candidate.title.trim(),
    category,
    condition,
    suggested_price_gel: suggestedPrice,
    city,
    description: candidate.description.trim(),
    model: candidate.model.trim(),
    year: candidate.year.trim(),
    brand: candidate.brand.trim(),
    color: candidate.color.trim(),
    keySpecs,
    accessories,
  };
}

const router: IRouter = Router();

const analyzeItem = async (req: Request, res: Response) => {
  const parsed = AnalyzeItemImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "სურათის მონაცემები არასწორია" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    req.log.info("OpenAI key missing; returning mock item analysis");
    res.json(mockAnalysis);
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a vision assistant for a Georgian peer-to-peer marketplace. Analyze the single uploaded item photo carefully and return only valid JSON with exactly these fields: title, category, condition, suggested_price_gel, city, description, model, year, brand, color, keySpecs, accessories. Use Georgian for title, category, condition, city, description, model, year, brand, color, keySpecs, and accessories. Allowed categories are exactly: ტექნიკა, ტანსაცმელი და ფეხსაცმელი, ჰობი და სპორტი, თავის მოვლა, საბავშვო, სახლი და დეკორი. Allowed conditions are exactly: ახალი, თითქმის ახალი, მეორადი, ნაწილებისთვის. City must be თბილისი unless the user location is explicitly known; never infer a different city from the photo. suggested_price_gel must be a realistic integer local resale value in Georgian Lari based on the visible item and condition. Identify the exact brand, model, year, color, visible key specs, and visible accessories whenever legible. Do not use generic titles such as Laptop, Shoes, Phone, or Item, and do not invent an exact model when the photo cannot support it; instead use the most specific visible product identity and clearly state that the model is not visible. keySpecs and accessories must be arrays of short Georgian strings. The description must be professional Georgian and formatted as: one brief overview sentence, then bullet lines beginning with • for key specs and visual condition, then a final line beginning with კომპლექტაცია: listing the original box, charger, or accessories visible in the photo (or stating რომ აქსესუარი ფოტოზე არ ჩანს).",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "გააანალიზე ეს ნივთის ფოტო და მოამზადე განცხადების საწყისი მონაცემები.",
              },
              { type: "image_url", image_url: { url: parsed.data.image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      req.log.warn({ status: response.status }, "OpenAI item analysis failed");
      res.json(mockAnalysis);
      return;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      req.log.warn("OpenAI returned an empty item analysis; using mock analysis");
      res.json(mockAnalysis);
      return;
    }

    const analysis = normalizeAnalysis(AnalyzeItemImageResponse.parse(JSON.parse(content)));
    res.json(analysis);
  } catch (error) {
    req.log.warn({ err: error }, "OpenAI item analysis request failed");
    res.json(mockAnalysis);
  }
};

router.post("/ai-analyze", analyzeItem);
router.post("/openai/analyze-item", analyzeItem);

export default router;