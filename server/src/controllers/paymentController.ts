import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sslcommerzService } from '../services/sslcommerzService';
import { dataStore } from '../services/dataStore';
import { config } from '../config/env';

export const paymentController = {
  /**
   * Initiate SSLCommerz Checkout Session
   */
  initiateSSLCommerz: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Please sign in to proceed with checkout.' });
      }

      const { plan = 'pro', currency = 'BDT', billingCycle = 'monthly', phoneNumber } = req.body;

      if (!['pro', 'enterprise'].includes(plan)) {
        return res.status(400).json({ success: false, message: 'Invalid plan selected. Choose Professional or Enterprise.' });
      }

      // Determine server base URL
      const serverBaseUrl = `${req.protocol}://${req.get('host')}`;

      const userId = user.id || (user as any)._id;

      const initResult = await sslcommerzService.initPayment(
        {
          userId,
          userEmail: user.email,
          userName: user.name,
          plan,
          billingCycle,
          currency,
          phoneNumber,
        },
        serverBaseUrl
      );

      return res.json({
        success: true,
        gatewayUrl: initResult.gatewayUrl,
        tranId: initResult.tranId,
        amount: initResult.amount,
        currency: initResult.currency,
        isMockFallback: initResult.isMockFallback,
        message: initResult.message,
      });
    } catch (err: any) {
      console.error('[PaymentController] Initiation error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Payment initiation failed' });
    }
  },

  /**
   * SSLCommerz Success Callback (POST)
   */
  handleSuccess: async (req: Request, res: Response) => {
    try {
      console.log('[SSLCommerz Callback] Success hit with body:', req.body);
      const {
        tran_id,
        val_id,
        amount,
        card_type,
        bank_tran_id,
        status,
        value_a: userId,
        value_b: plan,
      } = req.body;

      if (!tran_id) {
        return res.redirect('/pricing?payment_status=failed&message=Missing+transaction+ID');
      }

      const payment = dataStore.getPaymentByTranId(tran_id);
      const targetUserId = userId || payment?.userId;
      const targetPlan = plan || payment?.plan || 'pro';

      // Validate payment with SSLCommerz validation API
      let isValid = true;
      if (val_id && !val_id.startsWith('TEST_VAL_')) {
        const validation = await sslcommerzService.validatePayment(val_id);
        isValid = validation.isValid;
      }

      if (isValid) {
        // 1. Update Payment record
        dataStore.updatePayment(tran_id, {
          valId: val_id || `VAL_${Date.now()}`,
          status: 'success',
          cardType: card_type || 'SSLCommerz-Generic',
          bankTranId: bank_tran_id || `BANK_${Date.now()}`,
          amount: parseFloat(amount) || payment?.amount || 480,
        });

        // 2. Upgrade User Subscription Plan
        if (targetUserId) {
          dataStore.updateUser(targetUserId, {
            plan: targetPlan,
          });

          dataStore.createLog({
            action: 'payment_success',
            details: `User upgraded to ${targetPlan.toUpperCase()} plan via SSLCommerz (TranID: ${tran_id})`,
            userId: targetUserId,
          });
        }

        return res.redirect(
          `/pricing?payment_status=success&tran_id=${encodeURIComponent(tran_id)}&plan=${encodeURIComponent(targetPlan)}&amount=${encodeURIComponent(amount || '')}&card_type=${encodeURIComponent(card_type || 'SSLCommerz')}`
        );
      } else {
        dataStore.updatePayment(tran_id, {
          status: 'failed',
          metadata: { failureReason: 'Validation rejected' },
        });
        return res.redirect(`/pricing?payment_status=failed&tran_id=${encodeURIComponent(tran_id)}`);
      }
    } catch (err: any) {
      console.error('[PaymentController] Success callback error:', err);
      return res.redirect('/pricing?payment_status=failed&message=Internal+error');
    }
  },

  /**
   * SSLCommerz Fail Callback (POST)
   */
  handleFail: async (req: Request, res: Response) => {
    try {
      const { tran_id, failedreason } = req.body;
      console.warn('[SSLCommerz Callback] Payment Failed:', tran_id, failedreason);

      if (tran_id) {
        dataStore.updatePayment(tran_id, {
          status: 'failed',
          metadata: { failedreason },
        });
      }

      return res.redirect(`/pricing?payment_status=failed&tran_id=${encodeURIComponent(tran_id || '')}`);
    } catch (err: any) {
      return res.redirect('/pricing?payment_status=failed');
    }
  },

  /**
   * SSLCommerz Cancel Callback (POST)
   */
  handleCancel: async (req: Request, res: Response) => {
    try {
      const { tran_id } = req.body;
      console.log('[SSLCommerz Callback] Payment Cancelled by user:', tran_id);

      if (tran_id) {
        dataStore.updatePayment(tran_id, {
          status: 'cancelled',
        });
      }

      return res.redirect(`/pricing?payment_status=cancelled&tran_id=${encodeURIComponent(tran_id || '')}`);
    } catch (err: any) {
      return res.redirect('/pricing?payment_status=cancelled');
    }
  },

  /**
   * SSLCommerz IPN (Instant Payment Notification)
   */
  handleIPN: async (req: Request, res: Response) => {
    try {
      console.log('[SSLCommerz IPN] Received notification:', req.body);
      const { tran_id, val_id, status, value_a: userId, value_b: plan } = req.body;

      if (tran_id && (status === 'VALID' || status === 'VALIDATED')) {
        dataStore.updatePayment(tran_id, {
          valId: val_id,
          status: 'success',
        });

        if (userId && plan) {
          dataStore.updateUser(userId, { plan });
        }
      }

      return res.status(200).send('IPN Received OK');
    } catch (err: any) {
      console.error('[SSLCommerz IPN] Error processing IPN:', err);
      return res.status(500).send('Error');
    }
  },

  /**
   * Simulate completion in test environment (e.g., interactive bKash/Nagad/Cards checkout test)
   */
  simulateComplete: async (req: AuthRequest, res: Response) => {
    try {
      const { tranId, paymentMethod = 'bKash Online', phoneNumber } = req.body;

      if (!tranId) {
        return res.status(400).json({ success: false, message: 'Missing transaction ID' });
      }

      const payment = dataStore.getPaymentByTranId(tranId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      const valId = `SIM_VAL_${Date.now()}`;
      const bankTranId = `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Update payment
      dataStore.updatePayment(tranId, {
        valId,
        status: 'success',
        cardType: paymentMethod,
        bankTranId,
        metadata: { simulated: true, completedAt: new Date().toISOString(), phoneNumber },
      });

      // Upgrade user
      if (payment.userId) {
        dataStore.updateUser(payment.userId, {
          plan: payment.plan || 'pro',
        });

        dataStore.createLog({
          action: 'payment_success',
          details: `User subscribed to ${payment.plan?.toUpperCase()} via ${paymentMethod} (TranID: ${tranId})`,
          userId: payment.userId,
        });
      }

      const updatedUser = dataStore.findUserById(payment.userId);

      return res.json({
        success: true,
        message: 'Payment completed successfully!',
        payment: {
          tranId,
          plan: payment.plan,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod,
          bankTranId,
        },
        user: updatedUser,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Direct Plan Upgrade (1-click activation without external payment gateway hurdles)
   */
  directUpgradePlan: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Please log in to upgrade your plan.' });
      }

      const { plan, billingCycle = 'monthly' } = req.body;
      if (!plan || !['pro', 'enterprise'].includes(plan)) {
        return res.status(400).json({ success: false, message: 'Invalid plan selected. Choose Pro or Enterprise.' });
      }

      const userId = user.id || (user as any)._id;
      const amount = plan === 'pro' ? (billingCycle === 'yearly' ? 38 : 4) : (billingCycle === 'yearly' ? 190 : 19);
      const tranId = `DM_ACT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Create success transaction record
      dataStore.createPayment({
        tranId,
        userId,
        userEmail: user.email,
        userName: user.name,
        plan,
        billingCycle,
        amount,
        currency: 'USD',
        status: 'success',
        gateway: 'Production Instant Upgrade',
        cardType: 'Instant Plan Activation',
        bankTranId: `AUTH_${Date.now()}`,
        metadata: {
          activatedAt: new Date().toISOString(),
          billingCycle,
          mode: 'production_direct',
        },
      });

      // Update user plan
      await dataStore.updateUserAsync(userId, {
        plan,
      });

      const updatedUser = dataStore.findUserById(userId);

      // Log system activity
      dataStore.createLog({
        category: 'user',
        action: 'plan_upgrade',
        details: `User upgraded to ${plan.toUpperCase()} ($${amount} USD / ${billingCycle})`,
        userId,
      });

      return res.json({
        success: true,
        message: `Congratulations! Your account has been upgraded to ${plan.toUpperCase()}!`,
        user: updatedUser,
        plan,
        amount,
        currency: 'USD',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to upgrade plan.' });
    }
  },

  /**
   * Get user payment history
   */
  getMyPayments: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = user.id || (user as any)._id;
      const payments = dataStore.getUserPayments(userId);
      return res.json({ success: true, payments });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get specific transaction details
   */
  getPaymentStatus: async (req: Request, res: Response) => {
    try {
      const { tranId } = req.params;
      const payment = dataStore.getPaymentByTranId(tranId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      return res.json({ success: true, payment });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
