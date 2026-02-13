import { Router } from 'express';
import { register, login, createUser, updateProfile, updateUserById, verifyToken, setAuthCookie, verifyAdminToken, forgotPassword, resetPassword } from '../controllers/auth.controller';
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

// POST /api/auth/forgot-password (legacy)
router.post('/forgot-password', forgotPassword);

// POST /api/auth/request-password-reset (matches frontend)
router.post('/request-password-reset', forgotPassword);

// POST /api/auth/reset-password/:token (path param)
router.post('/reset-password/:token', resetPassword);

// POST /api/auth/reset-password?token=... (query param - for frontend flexibility)
router.post('/reset-password', resetPassword);

// PUT /api/auth/:id
router.put(
  "/:id",
  authorizedMiddleware,
  uploads.single("image"),
  updateUserById
);

export default router;