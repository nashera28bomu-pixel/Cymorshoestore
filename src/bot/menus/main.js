import { sendMessage } from '../index.js';
import { FOOTER } from '../../utils/helpers.js';

export async function handleMainMenu(sock, jid, session, user, isGreeting = false, text = '') {
  // Handle number selection from main menu
  if (!isGreeting && text) {
    switch (text) {
      case '1':
        session.state = 'SHOP';
        session.subState = null;
        await session.save();
        return showCategoryMenu(sock, jid);

      case '2':
        session.state = 'TRACK';
        await session.save();
        return sendMessage(jid,
          `📦 *ORDER TRACKING*\n\n` +
          `Enter your Order ID below:\n` +
          `_(e.g. ORD-0042)_\n\n` +
          `Reply *0* to go back.` +
          FOOTER
        );

      case '3':
        session.state = 'CART';
        await session.save();
        const { handleCartFlow } = await import('./cart.js');
        return handleCartFlow(sock, jid, session, user, 'view');

      case '4':
        session.state = 'SUPPORT';
        await session.save();
        return sendMessage(jid,
          `💬 *CUSTOMER SUPPORT*\n\n` +
          `Type your message below and our team will get back to you shortly.\n\n` +
          `📞 We typically respond within *30 minutes* during business hours.\n\n` +
          `Reply *0* to go back.` +
          FOOTER
        );

      case '5':
        return sendMessage(jid,
          `ℹ️ *ABOUT SOLEZ KE*\n\n` +
          `👟 *Step Into Your Story*\n\n` +
          `SOLEZ KE is Kenya's premium online shoe store — where style meets comfort. We stock the freshest kicks, classic formals, and everything in between.\n\n` +
          `🏪 *What We Offer:*\n` +
          `• Men's, Women's & Kids' shoes\n` +
          `• Sports & Sneakers\n` +
          `• Formal & Office shoes\n\n` +
          `🚚 *Countrywide delivery* to all 47 counties\n` +
          `💳 *M-Pesa payments* — fast & secure\n` +
          `📦 *Order tracking* in real time\n\n` +
          `📱 *Business Hours:*\n` +
          `Mon–Sat: 8:00 AM – 8:00 PM EAT\n` +
          `Sunday: 10:00 AM – 5:00 PM EAT\n\n` +
          `Reply *0* to go back.` +
          FOOTER
        );

      default:
        // Fall through to show menu
        break;
    }
  }

  // Build welcome/menu message
  const isReturning = user.isReturning;
  const name = user.name;

  let greeting = '';
  if (isGreeting) {
    if (isReturning && name) {
      greeting = `Welcome back, *${name}*! 👋 Great to see you again.\n\n`;
    } else {
      greeting = `Welcome to *SOLEZ KE* 🎉 Kenya's freshest shoe store!\n\n`;
    }
  }

  const menu =
    `${greeting}` +
    `╔═══════════════════════╗\n` +
    `║   👟  *S O L E Z  K E*  👟   ║\n` +
    `║   _Step Into Your Story_   ║\n` +
    `╚═══════════════════════╝\n\n` +
    `🔥 *Premium Shoes. Unbeatable Prices.*\n` +
    `🚚 Countrywide Delivery | 💳 M-Pesa\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `         📋 *MAIN MENU*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `1️⃣  👟 *Shop Shoes*\n` +
    `2️⃣  📦 *Track My Order*\n` +
    `3️⃣  🛒 *View My Cart*` + (session.cart.length > 0 ? ` _(${session.cart.length} item${session.cart.length > 1 ? 's' : ''})_` : '') + `\n` +
    `4️⃣  💬 *Talk to Support*\n` +
    `5️⃣  ℹ️  *About Us*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_Reply with a number to continue_` +
    FOOTER;

  await sendMessage(jid, menu);

  session.state = 'MAIN_MENU';
  await session.save();

  // Mark as returning for next visit
  if (!user.isReturning) {
    user.isReturning = true;
    await user.save();
  }
}

export async function showCategoryMenu(sock, jid) {
  const msg =
    `👟 *SHOP BY CATEGORY*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `1️⃣  👨 *Men's Shoes*\n` +
    `2️⃣  👩 *Women's Shoes*\n` +
    `3️⃣  🧒 *Kids' Shoes*\n` +
    `4️⃣  ⚽ *Sports & Sneakers*\n` +
    `5️⃣  👔 *Formal Shoes*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `0️⃣  🔙 *Back to Main Menu*\n\n` +
    `_Reply with a number to browse_` +
    FOOTER;

  await sendMessage(jid, msg);
}
