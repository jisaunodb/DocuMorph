import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/files', adminController.getAllFiles);
router.get('/conversions', adminController.getAllConversions);
router.get('/logs', adminController.getActivityLogs);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;
