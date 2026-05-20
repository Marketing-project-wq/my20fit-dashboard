import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mcuRouter from "./mcu";
import nutritionRouter from "./nutrition";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(mcuRouter);
router.use(nutritionRouter);

export default router;
