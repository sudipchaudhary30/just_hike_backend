import { Router } from 'express';
import { register, login, createUser, updateProfile, updateUserById, verifyToken, setAuthCookie, verifyAdminToken } from '../controllers/auth.controller';
import { uploads } from '../middlewares/upload.middleware';
import { authorizedMiddleware, adminOnlyMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/user (public user creation with image)
router.post('/user', uploads.single("image"), createUser);

// PUT /api/auth/update-profile
router.put(
  "/update-profile",
  authorizedMiddleware,
  uploads.single("image"),
  updateProfile
);

// GET /api/auth/verify
router.get(
  "/verify",
  authorizedMiddleware,
  verifyToken
);

// GET /api/auth/verify-admin
router.get(
  "/verify-admin",
  authorizedMiddleware,
  adminOnlyMiddleware,
  verifyAdminToken
);

// POST /api/auth/set-cookies
router.post(
  "/set-cookies",
  setAuthCookie
);

// PUT /api/auth/:id
router.put(
  "/:id",
  authorizedMiddleware,
  uploads.single("image"),
  updateUserById
);

export default router;