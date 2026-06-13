import express from 'express';
import Session from '../models/Session.js';
import { confirmOrderAfterPayment } from '../bot/menus/checkout.js';

const router = express.Router();

// Extract callback logic so we can reuse it
export async function handleMpesaCallback(reqBody) {
  try {
    const body = reqBody?.Body?.stkCallback;
    if (!body) return;

    const { ResultCode, CheckoutRequestID, CallbackMetadata } = body;

    if (ResultCode !== 0) {
      console.log(`STK Push failed. Code: ${ResultCode}, CheckoutRequestID: ${CheckoutRequestID}`);

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

    const items = CallbackMetadata?.Item || [];
    const getMeta = (name) => items.find(i => i.Name === name)?.Value;

    const mpesaRef = getMeta('MpesaReceiptNumber');
    const phone = String(getMeta('PhoneNumber') || '');

    console.log(`✅ Payment confirmed: ${mpesaRef} | Phone: ${phone} | CheckoutID: ${CheckoutRequestID}`);

    await confirmOrderAfterPayment(phone, mpesaRef, CheckoutRequestID);

  } catch (err) {
    console.error('M-Pesa callback error:', err.message);
  }
}

// Route handler for Daraja
router.post('/callback', async (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  await handleMpesaCallback(req.body);
});

router.post('/validation', (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

router.post('/confirmation', (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

export default router;
