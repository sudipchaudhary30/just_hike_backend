import { Router } from "express";
import {
  createUserByAdmin,
  getAllUsersByAdmin,
  getUserByIdByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
} from "../controllers/admin.controller";
import { uploads } from "../middlewares/upload.middleware";
import {
  authorizedMiddleware,
  adminOnlyMiddleware,
} from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/users",
  authorizedMiddleware,
  adminOnlyMiddleware,
  uploads.single("image"),
  createUserByAdmin
);

router.get("/users", authorizedMiddleware, adminOnlyMiddleware, getAllUsersByAdmin);

router.get(
  "/users/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  getUserByIdByAdmin
);

router.put(
  "/users/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  uploads.single("image"),
  updateUserByAdmin
);

router.delete(
  "/users/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  deleteUserByAdmin
);

export default router;
