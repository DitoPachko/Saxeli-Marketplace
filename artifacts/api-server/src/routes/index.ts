import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketplaceRouter from "./marketplace";
import profileRouter from "./profile";
import aiRouter from "./ai";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketplaceRouter);
router.use(profileRouter);
router.use(aiRouter);
router.use(chatRouter);

export default router;
