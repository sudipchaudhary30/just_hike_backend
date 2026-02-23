import { Router } from "express";
import {
  createTrek,
  getAllTreks,
  getTrekById,
  updateTrek,
  deleteTrek,
} from "../controllers/trek.controller";
import { uploads } from "../middlewares/upload.middleware";
import { authorizedMiddleware, adminOnlyMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAllTreks);
router.get("/:id", getTrekById);


router.post(
  "/",
  authorizedMiddleware,
  adminOnlyMiddleware,
  uploads.single("trekImage"),
  createTrek
);


router.put(
  "/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  uploads.single("trekImage"),
  updateTrek
);

router.delete(
  "/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  deleteTrek
);

export default router;
