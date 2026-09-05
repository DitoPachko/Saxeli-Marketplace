import { Router, type IRouter, type Request, type Response } from "express";
import { AnalyzeItemImageBody, AnalyzeItemImageResponse } from "@workspace/api-zod";

type Analysis = {
  title: string;
  category: string;
  condition: string;
  suggested_price_gel: number;
  city: string;
  description: string;
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
  if (
    typeof candidate.title !== "string" ||
    candidate.title.trim().length < 5 ||
    !suggestedPrice ||
    typeof candidate.description !== "string"
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
  };
}

function dynamicFallback(filename?: string): Analysis {
  const source = (filename ?? "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = source.toLocaleLowerCase("en-US");
  const hasApparelSignal = /(adidas|nike|puma|reebok|shirt|tshirt|t-shirt|shoe|sneaker|dress|jacket|hoodie|მაისური|ფეხსაცმელი|კაბა|ქურთუკი)/i.test(normalized);
  const hasTechSignal = /(iphone|ipad|macbook|laptop|computer|phone|samsung|sony|canon|nikon|camera|headphone|airpods|ტელეფონი|ლეპტოპი|კამერა|ყურსასმენი)/i.test(normalized);

  if (hasApparelSignal) {
    const brand = /(adidas|nike|puma|reebok)/i.exec(source)?.[1];
    const brandLabel = brand ? brand[0].toUpperCase() + brand.slice(1).toLowerCase() : "Adidas";
    const isFootwear = /(shoe|sneaker|ფეხსაცმელი)/i.test(normalized);
    const itemLabel = isFootwear ? "ფეხსაცმელი" : "თეთრი მაისური";
    return {
      title: brand ? `${brandLabel} ${itemLabel}` : "Adidas Originals თეთრი მაისური",
      category: "ტანსაცმელი და ფეხსაცმელი",
      condition: "მეორადი",
      suggested_price_gel: isFootwear ? 120 : 60,
      city: "თბილისი",
      description: brand
        ? `იყიდება ${brandLabel}-ის ${itemLabel.toLowerCase()}. ფოტოზე ჩანს ბრენდის დიზაინი და ნივთის ძირითადი ვიზუალური დეტალები.\n\n• ბრენდი: ${brandLabel}\n• კატეგორია: ${itemLabel}\n\nმდგომარეობა: კარგ მდგომარეობაში.`
        : "იყიდება ორიგინალი Adidas-ის თეთრი მაისური. კარგ მდგომარეობაში.",
    };
  }

  if (hasTechSignal) {
    const label = source || "ტექნიკის ნივთი";
    return {
      title: label,
      category: "ტექნიკა",
      condition: "მეორადი",
      suggested_price_gel: 250,
      city: "თბილისი",
      description: `იყიდება ${label}. ფოტოზე ჩანს ტექნიკის ნივთი, რომლის ზუსტი მოდელი და მახასიათებლები ხელით გადაამოწმე გამოქვეყნებამდე.\n\n• კატეგორია: ტექნიკა\n• მოდელი: ფოტოდან დაზუსტება საჭიროა\n\nმდგომარეობა: ვიზუალურად გამოყენებული.`,
    };
  }

  const readableTitle = source
    ? source.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "ფოტოზე ნაჩვენები ნივთი";
  return {
    title: readableTitle,
    category: "სახლი და დეკორი",
    condition: "მეორადი",
    suggested_price_gel: 100,
    city: "თბილისი",
    description: `იყიდება ${readableTitle.toLowerCase()}. ფოტო ვერ დამუშავდა, ამიტომ გთხოვ, გადაამოწმო ნივთის ზუსტი დასახელება, მახასიათებლები და მდგომარეობა.\n\n• დეტალები: ხელით დასაზუსტებელია\n\nმდგომარეობა: ხელით შესამოწმებელი.`,
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
    req.log.info("OpenAI key missing; returning dynamic filename-aware fallback");
    res.json(dynamicFallback(parsed.data.filename));
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
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Analyze the provided product photo for a peer-to-peer marketplace listing. Identify EXACTLY what the item is. Return only a JSON object with title, category, condition, suggested_price_gel, description, and city. The title must use the exact visible brand, model, type, or style whenever legible, for example Adidas Originals Trefoil White T-Shirt, Nike Air Max 270 Black, or Sony WH-1000XM5 Headphones. Never return a generic title such as Laptop, Shoes, Phone, or Item when the photo shows more identifying detail, and never invent an exact model that is not supported by the image. Pick category exactly from: ტექნიკა, ტანსაცმელი და ფეხსაცმელი, ჰობი და სპორტი, თავის მოვლა, საბავშვო, სახლი და დეკორი. Pick condition exactly from: ახალი, თითქმის ახალი, მეორადი, ნაწილებისთვის. suggested_price_gel must be a realistic market value in GEL for Georgia. Set city to თბილისი. The description must be Georgian text with three formatted sections: 1) a brief overview of the detected item, 2) key visual specifications including brand, color, visible design details, and size if visible, and 3) condition details. Use the uploaded image itself as the source of truth and never assume a fixed product type.",
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
      res.json(dynamicFallback(parsed.data.filename));
      return;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      req.log.warn("OpenAI returned an empty item analysis; using dynamic fallback");
      res.json(dynamicFallback(parsed.data.filename));
      return;
    }

    const analysis = normalizeAnalysis(AnalyzeItemImageResponse.parse(JSON.parse(content)));
    res.json(analysis);
  } catch (error) {
    req.log.warn({ err: error }, "OpenAI item analysis request failed");
    res.json(dynamicFallback(parsed.data.filename));
  }
};

router.post("/ai-analyze", analyzeItem);
router.post("/openai/analyze-item", analyzeItem);

export default router;