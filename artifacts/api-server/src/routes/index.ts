import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mcuRouter from "./mcu";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mcuRouter);

export default router;
