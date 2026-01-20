import { Router } from 'express';
import { register, login } from '../controllers/auth.controller'; // This MUST match

const router = Router();

// POST /api/auth/register
router.post('/register', register);


export default router;