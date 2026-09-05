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

function normalizeImageForVision(image: string) {
  const trimmed = image.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const dataUrlMatch = trimmed.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is);
  if (dataUrlMatch) {
    return `data:${dataUrlMatch[1]};base64,${dataUrlMatch[2].replace(/\s/g, "")}`;
  }

  return `data:image/jpeg;base64,${trimmed.replace(/\s/g, "")}`;
}

function filenameFallback(filename?: string): Analysis | null {
  const source = (filename ?? "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!source) return null;

  const normalized = source.toLocaleLowerCase("en-US");
  const hasApparelSignal = /(shirt|tshirt|t-shirt|shoe|sneaker|dress|jacket|hoodie|მაისური|ფეხსაცმელი|კაბა|ქურთუკი)/i.test(normalized);
  const hasTechSignal = /(iphone|ipad|laptop|computer|phone|samsung|sony|canon|nikon|camera|headphone|airpods|ტელეფონი|ლეპტოპი|კამერა|ყურსასმენი)/i.test(normalized);
  const title = source.replace(/\b\w/g, (letter) => letter.toUpperCase());

  if (hasApparelSignal) {
    const isFootwear = /(shoe|sneaker|ფეხსაცმელი)/i.test(normalized);
    return {
      title,
      category: "ტანსაცმელი და ფეხსაცმელი",
      condition: "მეორადი",
      suggested_price_gel: isFootwear ? 120 : 60,
      city: "თბილისი",
      description: `იყიდება ${title}. ფოტოს მიხედვით ჩანს ტანსაცმლის ან ფეხსაცმლის ნივთი.\n\n• წყარო: ატვირთული ფაილის სახელი\n• ზუსტი ბრენდი და მოდელი: ხელით გადაამოწმე\n\nმდგომარეობა: ფოტოზე სრულად ვერ დადასტურდა.`,
    };
  }

  if (hasTechSignal) {
    return {
      title,
      category: "ტექნიკა",
      condition: "მეორადი",
      suggested_price_gel: 250,
      city: "თბილისი",
      description: `იყიდება ${title}. ფოტოს მიხედვით ჩანს ტექნიკის ნივთი, რომლის ზუსტი მოდელი და მახასიათებლები ხელით გადაამოწმე.\n\n• კატეგორია: ტექნიკა\n• იდენტიფიკაცია: ფაილის სახელიდან მიღებული მინიშნება\n\nმდგომარეობა: ვიზუალურად შესამოწმებელი.`,
    };
  }

  return {
    title,
    category: "სახლი და დეკორი",
    condition: "მეორადი",
    suggested_price_gel: 100,
    city: "თბილისი",
    description: `იყიდება ${title}. ფოტო ვერ დამუშავდა, ამიტომ გთხოვ, გადაამოწმო ნივთის ზუსტი დასახელება, მახასიათებლები და მდგომარეობა.\n\n• დეტალები: ფაილის სახელიდან მიღებული მინიშნება\n\nმდგომარეობა: ხელით შესამოწმებელი.`,
  };
}

function respondWithFilenameFallback(
  req: Request,
  res: Response,
  filename?: string,
) {
  const fallback = filenameFallback(filename);
  if (fallback) {
    res.json(fallback);
    return;
  }

  req.log.warn("AI analysis unavailable and no filename fallback is possible");
  res.status(503).json({ error: "AI ანალიზი დროებით მიუწვდომელია" });
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
    req.log.info("OpenAI key missing; using filename-only fallback when available");
    respondWithFilenameFallback(req, res, parsed.data.filename);
    return;
  }

  try {
    const imageUrl = normalizeImageForVision(parsed.data.image);
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
              "Analyze the provided product photo for a peer-to-peer marketplace listing. Identify EXACTLY what the item is. Return only a JSON object with title, category, condition, suggested_price_gel, description, and city. The title must use the exact visible brand, model, type, or style whenever legible, including the brand's own product naming. Never return a generic title such as Laptop, Shoes, Phone, or Item when the photo shows more identifying detail, and never invent an exact model that is not supported by the image. Pick category exactly from: ტექნიკა, ტანსაცმელი და ფეხსაცმელი, ჰობი და სპორტი, თავის მოვლა, საბავშვო, სახლი და დეკორი. Pick condition exactly from: ახალი, თითქმის ახალი, მეორადი, ნაწილებისთვის. suggested_price_gel must be a realistic market value in GEL for Georgia. Set city to თბილისი. The description must be Georgian text with three formatted sections: 1) a brief overview of the detected item, 2) key visual specifications including brand, color, visible design details, and size if visible, and 3) condition details. Use the uploaded image itself as the source of truth and never assume a fixed product type.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify this exact item, brand, model, category, realistic GEL market price, and write a structured Georgian sales description.",
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      req.log.warn({ status: response.status }, "OpenAI item analysis failed");
      respondWithFilenameFallback(req, res, parsed.data.filename);
      return;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      req.log.warn("OpenAI returned an empty item analysis; using filename fallback");
      respondWithFilenameFallback(req, res, parsed.data.filename);
      return;
    }

    const analysis = normalizeAnalysis(AnalyzeItemImageResponse.parse(JSON.parse(content)));
    res.json(analysis);
  } catch (error) {
    req.log.warn({ err: error }, "OpenAI item analysis request failed");
    respondWithFilenameFallback(req, res, parsed.data.filename);
  }
};

router.post("/ai-analyze", analyzeItem);
router.post("/openai/analyze-item", analyzeItem);

export default router;