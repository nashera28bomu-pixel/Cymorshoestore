import { sendMessage } from '../index.js';
import { FOOTER, formatCurrency } from '../../utils/helpers.js';

export async function handleCartFlow(sock, jid, session, user, text) {
  if (session.cart.length === 0) {
    session.state = 'MAIN_MENU';
    await session.save();
    return sendMessage(jid,
      `🛒 *Your cart is empty!*\n\n` +
      `Start shopping to add items.\n\n` +
      `Reply *1* to browse shoes or *MENU* to go home.` + FOOTER
    );
  }

  if (text === 'view' || session.subState === null) {
    session.subState = 'VIEWING';
    await session.save();
    return showCart(jid, session);
  }

  if (session.subState === 'VIEWING') {
    switch (text) {
      case '1':
        // Checkout
        session.state = 'CHECKOUT';
        session.subState = null;
        await session.save();
        const { handleCheckoutFlow } = await import('./checkout.js');
        return handleCheckoutFlow(sock, jid, session, user, 'start');

      case '2':
        // Add more items
        session.state = 'SHOP';
        session.subState = null;
        await session.save();
        const { showCategoryMenu } = await import('./main.js');
        return showCategoryMenu(sock, jid);

      case '3':
        // Remove item
        session.subState = 'REMOVING';
        await session.save();
        return showRemoveMenu(jid, session);

      case '0':
        session.state = 'MAIN_MENU';
        session.subState = null;
        await session.save();
        const { handleMainMenu } = await import('./main.js');
        return handleMainMenu(sock, jid, session, user, false);

      default:
        return showCart(jid, session);
    }
  }

  if (session.subState === 'REMOVING') {
    if (text === '0') {
      session.subState = 'VIEWING';
      await session.save();
      return showCart(jid, session);
    }

    const idx = parseInt(text) - 1;
    if (isNaN(idx) || idx < 0 || idx >= session.cart.length) {
      return sendMessage(jid,
        `⚠️ Invalid item number. Reply with 1–${session.cart.length} or *0* to cancel.` + FOOTER
      );
    }

    const removed = session.cart.splice(idx, 1)[0];
    await session.save();

    await sendMessage(jid,
      `🗑️ *Removed from cart:*\n` +
      `👟 ${removed.productName} _(Size ${removed.size})_\n\n` +
      (session.cart.length > 0
        ? `Your cart now has *${session.cart.length} item${session.cart.length > 1 ? 's' : ''}*.\n\nReply *CART* to view cart or *MENU* to go home.`
        : `Your cart is now empty.\n\nReply *1* to browse shoes or *MENU* to go home.`) +
      FOOTER
    );

    session.subState = null;
    session.state = session.cart.length > 0 ? 'CART' : 'MAIN_MENU';
    await session.save();
  }
}

export async function showCart(jid, session) {
  let msg = `🛒 *YOUR CART*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  let subtotal = 0;
  session.cart.forEach((item, i) => {
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;
    msg += `*${i + 1}.* 👟 ${item.productName}\n`;
    msg += `    📐 Size: ${item.size} | Qty: ${item.quantity}\n`;
    msg += `    💰 ${formatCurrency(lineTotal)}\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🧾 Subtotal: *${formatCurrency(subtotal)}*\n`;
  msg += `🚚 Delivery: _calculated at checkout_\n\n`;
  msg += `1️⃣  ✅ *Checkout*\n`;
  msg += `2️⃣  ➕ *Add More Items*\n`;
  msg += `3️⃣  🗑️  *Remove an Item*\n`;
  msg += `0️⃣  🔙 *Back to Menu*\n\n`;
  msg += `_Reply with a number_` + FOOTER;

  await sendMessage(jid, msg);
}

async function showRemoveMenu(jid, session) {
  let msg = `🗑️ *REMOVE ITEM*\n\n`;
  msg += `Which item would you like to remove?\n\n`;

  session.cart.forEach((item, i) => {
    msg += `*${i + 1}.* ${item.productName} _(Size ${item.size})_ — ${formatCurrency(item.price)}\n`;
  });

  msg += `\n0️⃣  Cancel\n\n`;
  msg += `_Reply with item number_` + FOOTER;

  await sendMessage(jid, msg);
}
