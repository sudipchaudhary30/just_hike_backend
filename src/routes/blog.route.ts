import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getAllBlogsAdmin,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.controller";
import { uploads } from "../middlewares/upload.middleware";
import { authorizedMiddleware, adminOnlyMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAllBlogs);
router.get("/admin/all", authorizedMiddleware, adminOnlyMiddleware, getAllBlogsAdmin);
router.get("/:id", getBlogById);


router.post(
  "/",
  authorizedMiddleware,
  adminOnlyMiddleware,
  uploads.single("blogImage"),
  createBlog
);


router.put(
  "/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  uploads.single("blogImage"),
  updateBlog
);

router.delete(
  "/:id",
  authorizedMiddleware,
  adminOnlyMiddleware,
  deleteBlog
);

export default router;
