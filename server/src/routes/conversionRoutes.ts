import { Router } from 'express';
import { conversionController } from '../controllers/conversionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/history', conversionController.getMyConversions);
router.delete('/clear', conversionController.clearHistory);
router.delete('/:id', conversionController.deleteConversion);

export default router;
