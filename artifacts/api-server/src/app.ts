import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/api", router);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if ((error as { type?: string })?.type === "entity.too.large") {
    res.status(413).json({ error: "ფოტო ძალიან დიდია. ატვირთე 20MB-ზე ნაკლები სურათი." });
    return;
  }

  res.status(500).json({ error: "სერვერის შეცდომა" });
});

export default app;
