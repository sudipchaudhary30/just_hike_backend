import { Router } from "express";
import {
  createGuide,
  getAllGuides,
  getGuideById,
  updateGuide,
  deleteGuide,
} from "../controllers/guide.controller";
import { uploads } from "../middlewares/upload.middleware";
import { authorizedMiddleware, adminOnlyMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAllGuides);
router.get("/:id", getGuideById);

router.post(
  "/",
  authorizedMiddleware,
  adminOnlyMiddleware,
  uploads.single("image"),
  createGuide
);

router.put(
  "/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  uploads.single("image"),
  updateGuide
);

router.delete(
  "/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  deleteGuide
);

export default router;
