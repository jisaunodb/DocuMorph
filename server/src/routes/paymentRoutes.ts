import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Direct 1-click upgrade (production plan activation)
router.post('/upgrade-plan', requireAuth, paymentController.directUpgradePlan);

// SSLCommerz payment initiation (Requires auth)
router.post('/sslcommerz/init', requireAuth, paymentController.initiateSSLCommerz);

// SSLCommerz callback endpoints (Public POST from SSLCommerz)
router.post('/sslcommerz/success', paymentController.handleSuccess);
router.post('/sslcommerz/fail', paymentController.handleFail);
router.post('/sslcommerz/cancel', paymentController.handleCancel);
router.post('/sslcommerz/ipn', paymentController.handleIPN);

// Test / Sandbox simulation completion
router.post('/sslcommerz/simulate-complete', requireAuth, paymentController.simulateComplete);

// User payment history
router.get('/history', requireAuth, paymentController.getMyPayments);

// Status check for specific transaction
router.get('/status/:tranId', paymentController.getPaymentStatus);

export default router;
