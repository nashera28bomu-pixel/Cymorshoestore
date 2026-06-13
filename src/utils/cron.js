import cron from 'node-cron';
import Session from '../models/Session.js';
import { sendMessage } from '../bot/index.js';
import { FOOTER } from './helpers.js';

// Run every 10 minutes
export function startAbandonmentCron() {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      // Find sessions with items in cart, inactive 30+ mins, not yet notified
      const abandoned = await Session.find({
        'cart.0': { $exists: true },
        lastActive: { $lt: thirtyMinsAgo, $gt: twoHoursAgo },
        abandonmentNotified: false,
        state: { $ne: 'AWAITING_PAYMENT' }
      });

      for (const session of abandoned) {
        const itemCount = session.cart.length;
        const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
        
        const msg = `👀 *Hey! You left some 🔥 shoes behind.*\n\n` +
          `You have *${itemCount} item${itemCount > 1 ? 's' : ''}* worth *KES ${total.toLocaleString()}* in your cart.\n\n` +
          `⚠️ Your cart expires soon!\n\n` +
          `Reply *CART* to pick up where you left off, or *MENU* to start fresh.` +
          FOOTER;

        await sendMessage(session.phone, msg);
        session.abandonmentNotified = true;
        await session.save();
      }

      // Clear carts older than 2 hours (expired)
      await Session.updateMany(
        {
          'cart.0': { $exists: true },
          lastActive: { $lt: twoHoursAgo },
          abandonmentNotified: true
        },
        {
          $set: {
            cart: [],
            state: 'IDLE',
            subState: null,
            abandonmentNotified: false,
            checkoutData: {}
          }
        }
      );

    } catch (err) {
      console.error('Abandonment cron error:', err.message);
    }
  });

  console.log('⏰ Cart abandonment cron started');
}
