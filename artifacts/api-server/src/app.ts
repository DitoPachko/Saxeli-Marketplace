import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

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
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use(
  "/api",
  (req, res, next) => {
    const publicRequest =
      req.path === "/" ||
      req.path === "/healthz" ||
      (req.method === "GET" &&
        (req.path === "/items" || req.path.startsWith("/items/")));
    if (publicRequest) {
      next();
      return;
    }

    const auth = getAuth(req);
    const userId = auth.sessionClaims?.userId || auth.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  },
  router,
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if ((error as { type?: string })?.type === "entity.too.large") {
    res.status(413).json({ error: "ფოტო ძალიან დიდია. ატვირთე 20MB-ზე ნაკლები სურათი." });
    return;
  }

  res.status(500).json({ error: "სერვერის შეცდომა" });
});

export default app;
