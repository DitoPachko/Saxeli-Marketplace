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
  if (!allowedCategories.includes(candidate.category ?? "")) {
    throw new Error("AI response has an invalid marketplace category");
  }
  if (!allowedConditions.includes(candidate.condition ?? "")) {
    throw new Error("AI response has an invalid item condition");
  }
  if (!allowedCities.includes(candidate.city ?? "")) {
    throw new Error("AI response has an invalid city");
  }
  const category = candidate.category!;
  const condition = candidate.condition!;
  const city = candidate.city!;
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

function localFallbackAnalysis(): Analysis {
  return {
    title: "ფოტოზე ნაჩვენები ნივთი",
    category: "ტექნიკა",
    condition: "მეორადი",
    suggested_price_gel: 100,
    city: "თბილისი",
    description:
      "ფოტოზე ნაჩვენები ნივთისთვის მომზადდა დროებითი აღწერა. გთხოვ, გადაამოწმე ზუსტი ბრენდი, მოდელი, ფერი და მდგომარეობა გამოქვეყნებამდე.\n\n• ვიზუალური დეტალები: ხელით გადასამოწმებელია\n• კომპლექტაცია: ფოტოზე დასაზუსტებელია\n\nმდგომარეობა: ხელით შესამოწმებელი.",
  };
}

function respondWithVisionFallback(req: Request, res: Response, reason: string) {
  req.log.warn(reason);
  res.json(localFallbackAnalysis());
}

const router: IRouter = Router();

const analyzeItem = async (req: Request, res: Response) => {
  const parsed = AnalyzeItemImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "სურათის მონაცემები არასწორია" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured");
    console.error("Vision API Error:", error);
    respondWithVisionFallback(req, res, error.message);
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
      const details = (await response.text()).slice(0, 500);
      throw new Error(`OpenAI vision request failed (${response.status}): ${details}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty vision analysis");
    }

    const analysis = normalizeAnalysis(AnalyzeItemImageResponse.parse(JSON.parse(content)));
    res.json(analysis);
  } catch (error) {
    console.error("Vision API Error:", error);
    respondWithVisionFallback(req, res, "OpenAI vision analysis could not be completed");
  }
};

router.post("/ai-analyze", analyzeItem);
router.post("/openai/analyze-item", analyzeItem);

export default router;