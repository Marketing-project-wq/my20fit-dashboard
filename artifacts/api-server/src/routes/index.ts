import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mcuRouter from "./mcu";
import nutritionRouter from "./nutrition";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mcuRouter);
router.use(nutritionRouter);

export default router;
