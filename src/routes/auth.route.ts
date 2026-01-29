import { Router } from 'express';
import { register, login, updateProfile } from '../controllers/auth.controller';
import { uploads } from '../middlewares/upload.middleware';
import { authorizedMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// PUT /api/auth/update-profile
router.put(
  "/update-profile",
  authorizedMiddleware,
  uploads.single("image"),
  updateProfile
);

export default router;