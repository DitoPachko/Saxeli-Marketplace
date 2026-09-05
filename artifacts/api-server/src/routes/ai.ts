import { Router, type IRouter, type Request, type Response } from "express";
import { AnalyzeItemImageBody, AnalyzeItemImageResponse } from "@workspace/api-zod";

type Analysis = {
  brand: string;
  model: string;
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
    typeof candidate.brand !== "string" ||
    candidate.brand.trim().length < 2 ||
    typeof candidate.model !== "string" ||
    candidate.model.trim().length < 2 ||
    typeof candidate.title !== "string" ||
    candidate.title.trim().length < 5 ||
    !suggestedPrice ||
    typeof candidate.description !== "string"
  ) {
    throw new Error("AI response is missing listing fields");
  }

  return {
    brand: candidate.brand.trim(),
    model: candidate.model.trim(),
    title: candidate.title.trim(),
    category,
    condition,
    suggested_price_gel: suggestedPrice,
    city,
    description: candidate.description.trim(),
  };
}

function parseImageForGemini(image: string) {
  const trimmed = image.trim();
  const dataUrlMatch = trimmed.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is);
  const mimeType = dataUrlMatch?.[1] ?? "image/jpeg";
  const data = (dataUrlMatch?.[2] ?? trimmed).replace(/\s/g, "");

  if (!data || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw new Error("Uploaded image is not valid Base64 data");
  }

  return {
    mimeType,
    data,
  };
}

function parseGeminiJson(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(cleaned) as unknown;
}

function respondWithVisionError(req: Request, res: Response, reason: string) {
  req.log.warn(reason);
  res.status(503).json({ error: "AI ანალიზი დროებით მიუწვდომელია" });
}

const router: IRouter = Router();

const analyzeItem = async (req: Request, res: Response) => {
  const parsed = AnalyzeItemImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "სურათის მონაცემები არასწორია" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured");
    console.error("Gemini Vision API Error:", error);
    respondWithVisionError(req, res, error.message);
    return;
  }

  try {
    const image = parseImageForGemini(parsed.data.image);
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Analyze this uploaded marketplace product photo using only visible evidence. Return a JSON object with brand, model, title, category, condition, suggested_price_gel, city, and description. Identify the exact visible brand and model when legible; use უცნობი when either cannot be verified and never invent details. The title must be specific and include the verified brand/model or visible product type. category must be exactly one Georgian value from: ტექნიკა, ტანსაცმელი და ფეხსაცმელი, ჰობი და სპორტი, თავის მოვლა, საბავშვო, სახლი და დეკორი. condition must be exactly one value from: ახალი, თითქმის ახალი, მეორადი, ნაწილებისთვის. suggested_price_gel must be a realistic positive GEL resale price for Georgia. Set city to თბილისი. description must be Georgian and contain a short overview, visible specifications such as color/design/size, and condition details.",
                },
                {
                  inline_data: {
                    mime_type: image.mimeType,
                    data: image.data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                brand: { type: "STRING" },
                model: { type: "STRING" },
                title: { type: "STRING" },
                category: {
                  type: "STRING",
                  enum: allowedCategories,
                },
                condition: {
                  type: "STRING",
                  enum: allowedConditions,
                },
                suggested_price_gel: { type: "NUMBER" },
                city: {
                  type: "STRING",
                  enum: allowedCities,
                },
                description: { type: "STRING" },
              },
              required: [
                "brand",
                "model",
                "title",
                "category",
                "condition",
                "suggested_price_gel",
                "city",
                "description",
              ],
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const details = (await response.text()).slice(0, 500);
      throw new Error(`Gemini vision request failed (${response.status}): ${details}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const content = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!content) {
      throw new Error("Gemini returned an empty vision analysis");
    }

    const analysis = normalizeAnalysis(
      AnalyzeItemImageResponse.parse(parseGeminiJson(content)),
    );
    res.json(analysis);
  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    respondWithVisionError(req, res, "Gemini vision analysis could not be completed");
  }
};

router.post("/ai-analyze", analyzeItem);

export default router;