import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
// Ensure the file '../controllers/user.controller.ts' exists in the controllers directory.
// If the file is named differently (e.g., 'userController.ts'), update the import path accordingly.
import { createUser, updateUser } from "../controllers/user.controller";

const router = Router();

router.post("/", upload.single("profilePicture"), createUser);
router.put("/:id", upload.single("profilePicture"), updateUser);

export default router;