import { Router, type IRouter, type Request, type Response } from "express";
import { AnalyzeItemImageBody, AnalyzeItemImageResponse } from "@workspace/api-zod";

type Analysis = {
  title: string;
  category: string;
  estimatedPrice: number;
  description: string;
};

const allowedCategories = [
  "ტექნიკა და ელექტრონიკა",
  "ტანსაცმელი და ფეხსაცმელი",
  "ავტო / მოტო",
  "ჰობი, სპორტი და დასვენება",
  "სახლი და ინტერიერი",
  "სხვა",
];

function normalizeAnalysis(value: unknown): Analysis {
  const candidate = value as Partial<Analysis>;
  if (!allowedCategories.includes(candidate.category ?? "")) {
    throw new Error("AI response has an invalid marketplace category");
  }
  const category = candidate.category!;
  const estimatedPrice = Number.isFinite(candidate.estimatedPrice)
    && Number(candidate.estimatedPrice) > 0
    ? Math.round(Number(candidate.estimatedPrice))
    : 0;
  if (
    typeof candidate.title !== "string" ||
    candidate.title.trim().length < 5 ||
    !estimatedPrice ||
    typeof candidate.description !== "string"
  ) {
    throw new Error("AI response is missing listing fields");
  }

  return {
    title: candidate.title.trim(),
    category,
    estimatedPrice,
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

async function fetchGeminiWithRetry(apiKey: string, body: string) {
  const retryableStatuses = new Set([429, 500, 502, 503, 504]);
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response: globalThis.Response;
    try {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body,
        },
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === 3) throw lastError;
      await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** (attempt - 1)));
      continue;
    }

    if (response.ok) return response;

    const details = (await response.text()).slice(0, 500);
    lastError = new Error(`Gemini vision request failed (${response.status}): ${details}`);
    if (!retryableStatuses.has(response.status) || attempt === 3) {
      throw lastError;
    }

    await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** (attempt - 1)));
  }

  throw lastError ?? new Error("Gemini vision request failed");
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
    const requestBody = JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are an expert AI product recognition and valuation engine for a Georgian P2P marketplace. Analyze the uploaded photo and execute these steps in order:\n\n1. IDENTIFY BRAND & MODEL: Examine text, logos, silhouettes, tags, stitching, serial numbers, or distinct design languages. If a brand/model exists (e.g. BMW, Nike, Apple, Sony, Bosch, Zara), you MUST explicitly state it.\n2. TITLE FORMATION: The title MUST start with '[Brand] [Model/Item Name]' in Georgian or Latin script (e.g., 'BMW E39 M Sport-ის ბამპერი', 'iPhone 13 Pro', 'Maison Margiela Replica'). NEVER output purely descriptive sentences like 'შავი ნივთი' or 'ფოტოზე ნაჩვენები ნივთი'.\n3. CATEGORY CLASSIFICATION: Map strictly to one of: 'ტექნიკა და ელექტრონიკა', 'ტანსაცმელი და ფეხსაცმელი', 'ავტო / მოტო', 'ჰობი, სპორტი და დასვენება', 'სახლი და ინტერიერი', 'სხვა'.\n4. ACCURATE LOCAL VALUATION: Estimate the realistic second-hand market value in Georgian Lari (GEL ₾) based on the recognized brand tier, rarity, and visible condition. Avoid generic 100-120 ₾ placeholders.\n5. DESCRIPTION: Provide a concise Georgian breakdown detailing brand, specifications, materials, and condition.\n\nReturn ONLY valid raw JSON matching this schema:\n{\n  \"title\": \"string\",\n  \"category\": \"string\",\n  \"estimatedPrice\": number,\n  \"description\": \"string\"\n}",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Analyze this physical item and return only the required JSON object.",
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
                title: { type: "STRING" },
                category: {
                  type: "STRING",
                  enum: allowedCategories,
                },
                estimatedPrice: { type: "NUMBER" },
                description: { type: "STRING" },
              },
              required: [
                "title",
                "category",
                "estimatedPrice",
                "description",
              ],
            },
          },
        });
    const response = await fetchGeminiWithRetry(apiKey, requestBody);

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
    const message = error instanceof Error ? error.message : String(error);
    console.error("Gemini Vision API Error:", message);
    respondWithVisionError(req, res, message);
  }
};

router.post("/ai-analyze", analyzeItem);
router.post("/analyze-image", analyzeItem);

export default router;