import express from 'express';
import Session from '../models/Session.js';
import { confirmOrderAfterPayment } from '../bot/menus/checkout.js';

const router = express.Router();

// Daraja STK Push callback
router.post('/callback', async (req, res) => {
  // Always respond 200 immediately to Daraja
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return;

    const { ResultCode, CheckoutRequestID, CallbackMetadata } = body;

    // ResultCode 0 = success
    if (ResultCode !== 0) {
      console.log(`STK Push failed. Code: ${ResultCode}, CheckoutRequestID: ${CheckoutRequestID}`);

      // Notify customer of failure
      const session = await Session.findOne({
        'pendingPayment.checkoutRequestId': CheckoutRequestID
      });

      if (session) {
        const { sendMessage } = await import('../bot/index.js');
        const { FOOTER } = await import('../utils/helpers.js');
        await sendMessage(
          `${session.phone}@s.whatsapp.net`,
          `❌ *Payment Failed*\n\n` +
          `Your M-Pesa payment was not completed.\n\n` +
          `Please try again — Reply *MENU* to restart checkout.` + FOOTER
        );
        session.state = 'AWAITING_MPESA_PHONE';
        session.pendingPayment = null;
        await session.save();
      }
      return;
    }

    // Extract metadata
    const items = CallbackMetadata?.Item || [];
    const getMeta = (name) => items.find(i => i.Name === name)?.Value;

    const mpesaRef = getMeta('MpesaReceiptNumber');
    const phone = String(getMeta('PhoneNumber') || '');

    // Normalize phone: 2547XXXXXXXX → 2547XXXXXXXX, keep as-is
    let normalizedPhone = phone;
    if (normalizedPhone.startsWith('254')) {
      normalizedPhone = normalizedPhone; // already good
    }

    console.log(`✅ Payment confirmed: ${mpesaRef} | Phone: ${normalizedPhone} | CheckoutID: ${CheckoutRequestID}`);

    await confirmOrderAfterPayment(normalizedPhone, mpesaRef, CheckoutRequestID);

  } catch (err) {
    console.error('M-Pesa callback error:', err.message);
  }
});

// Daraja validation (required for C2B)
router.post('/validation', (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Daraja confirmation (required for C2B)
router.post('/confirmation', (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

export default router;
