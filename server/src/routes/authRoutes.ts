import { Router } from 'express';
import { authController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, authController.updateProfile);
router.post('/change-password', requireAuth, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/google', authController.googleAuth);

export default router;
