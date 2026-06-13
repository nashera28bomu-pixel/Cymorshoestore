import Order from '../../models/Order.js';
import { sendMessage } from '../index.js';
import { FOOTER, formatCurrency, formatDate } from '../../utils/helpers.js';

const STATUS_EMOJI = {
  PENDING:    '🕐 Pending',
  PROCESSING: '⚙️  Processing',
  SHIPPED:    '🚚 Shipped',
  DELIVERED:  '✅ Delivered',
  CANCELLED:  '❌ Cancelled'
};

const STATUS_DESC = {
  PENDING:    'We received your order and payment. Preparing it now!',
  PROCESSING: 'Your order is being packed and prepared for dispatch.',
  SHIPPED:    'Your shoes are on the way! Sit tight 🎉',
  DELIVERED:  'Your order has been delivered. Enjoy your new kicks! 👟',
  CANCELLED:  'This order was cancelled. Contact support if this is an error.'
};

export async function handleTrackFlow(sock, jid, session, user, text) {
  if (text === '0') {
    session.state = 'MAIN_MENU';
    await session.save();
    const { handleMainMenu } = await import('./main.js');
    return handleMainMenu(sock, jid, session, user, false);
  }

  // Handle "TRACK ORD-0042" format
  const trackMatch = text.match(/track\s+(ord-\d+)/i);
  const orderId = trackMatch
    ? trackMatch[1].toUpperCase()
    : text.toUpperCase().startsWith('ORD-')
      ? text.toUpperCase()
      : null;

  if (!orderId) {
    return sendMessage(jid,
      `📦 *ORDER TRACKING*\n\n` +
      `Please enter your Order ID:\n` +
      `_(e.g. ORD-0042)_\n\n` +
      `You can find your Order ID in your confirmation message.\n\n` +
      `Reply *0* to go back.` + FOOTER
    );
  }

  const phone = jid.replace('@s.whatsapp.net', '');
  const order = await Order.findOne({ orderId });

  if (!order) {
    return sendMessage(jid,
      `❌ *Order Not Found*\n\n` +
      `We couldn't find order *${orderId}*.\n\n` +
      `Please double-check the order ID and try again.\n` +
      `Need help? Reply *4* from the main menu to contact support.\n\n` +
      `Reply *0* to go back.` + FOOTER
    );
  }

  // Security: only show order to the customer who placed it
  if (order.customer.phone !== phone) {
    return sendMessage(jid,
      `❌ *Access Denied*\n\n` +
      `This order does not belong to your number.\n\n` +
      `Reply *0* to go back.` + FOOTER
    );
  }

  const statusBar = buildStatusBar(order.status);

  let msg =
    `📦 *ORDER TRACKING*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📋 Order: *${order.orderId}*\n` +
    `📅 Placed: ${formatDate(order.createdAt)}\n\n` +
    `${statusBar}\n\n` +
    `📌 Status: *${STATUS_EMOJI[order.status]}*\n` +
    `💬 _${STATUS_DESC[order.status]}_\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🛍️ *Items:*\n`;

  order.items.forEach(item => {
    msg += `  • ${item.productName} _(Sz ${item.size})_ x${item.quantity}\n`;
  });

  msg +=
    `\n📍 *Delivering to:*\n` +
    `${order.delivery.county}, ${order.delivery.address}\n\n` +
    `💰 *Total Paid:* ${formatCurrency(order.total)}\n`;

  if (order.mpesaRef) {
    msg += `💳 *M-Pesa Ref:* ${order.mpesaRef}\n`;
  }

  msg +=
    `\n━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💬 Need help? Reply *MENU* then choose Support.\n` +
    `🛍️ Shop again? Reply *MENU*` +
    FOOTER;

  session.state = 'MAIN_MENU';
  await session.save();

  await sendMessage(jid, msg);
}

function buildStatusBar(status) {
  const stages = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const idx = stages.indexOf(status);

  const icons = stages.map((s, i) => {
    if (i < idx) return '✅';
    if (i === idx) return '🔵';
    return '⚪';
  });

  return (
    `${icons[0]} Received\n` +
    `  ↓\n` +
    `${icons[1]} Processing\n` +
    `  ↓\n` +
    `${icons[2]} Shipped\n` +
    `  ↓\n` +
    `${icons[3]} Delivered`
  );
}
