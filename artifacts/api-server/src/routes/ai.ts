import { Router, type IRouter } from "express";
import { AnalyzeItemImageBody, AnalyzeItemImageResponse } from "@workspace/api-zod";

type Analysis = {
  title: string;
  category: string;
  condition: string;
  price: number;
  description: string;
};

const fallbackAnalysis: Analysis = {
  title: "მეორადი ნივთი",
  category: "ტექნიკა და ელექტრონიკა",
  condition: "კარგი",
  price: 150,
  description: "კარგ მდგომარეობაშია. დამატებითი დეტალები შეგიძლიათ თავად დააზუსტოთ.",
};

const router: IRouter = Router();

router.post("/openai/analyze-item", async (req, res) => {
  const parsed = AnalyzeItemImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "სურათის მონაცემები არასწორია" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI ანალიზი დროებით მიუწვდომელია" });
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
              "You help a Georgian marketplace seller create an honest listing from one item photo. Return only JSON with title, category, condition, price, description. Use Georgian language. Allowed categories: ტექნიკა და ელექტრონიკა, ტანსაცმელი და ფეხსაცმელი, ჰობი, სპორტი და დასვენება, თავის მოვლა და სილამაზე, საბავშვო სამყარო, სახლი და ინტერიერი. Allowed conditions: ახალი, თითქმის ახალი, მეორადი, ნაწილებად. Price is a reasonable integer estimate in Georgian Lari. If uncertain, be conservative and use a generic title.",
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
      res.status(503).json({ error: "AI ანალიზი დროებით მიუწვდომელია" });
      return;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      res.status(503).json({ error: "AI პასუხი ვერ მივიღეთ" });
      return;
    }

    const analysis = AnalyzeItemImageResponse.parse(JSON.parse(content));
    res.json(analysis);
  } catch (error) {
    req.log.warn({ err: error }, "OpenAI item analysis request failed");
    res.status(503).json({ error: "AI ანალიზი ვერ შესრულდა" });
  }
});

export default router;