import { sendMessage } from '../index.js';
import { FOOTER } from '../../utils/helpers.js';

export async function handleSupportFlow(sock, jid, session, user, text) {
  if (text === '0') {
    session.state = 'MAIN_MENU';
    await session.save();
    const { handleMainMenu } = await import('./main.js');
    return handleMainMenu(sock, jid, session, user, false);
  }

  const phone = jid.replace('@s.whatsapp.net', '');
  const ownerPhone = process.env.OWNER_PHONE;

  // Forward message to owner
  if (ownerPhone) {
    const fwd =
      `💬 *SUPPORT MESSAGE*\n\n` +
      `👤 Customer: ${user.name || 'Unknown'}\n` +
      `📱 Phone: ${phone}\n` +
      `🕐 Time: ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}\n\n` +
      `📩 Message:\n"${text}"\n\n` +
      `_Reply directly to this number to respond._` + FOOTER;

    try {
      await sendMessage(`${ownerPhone}@s.whatsapp.net`, fwd);
    } catch (e) {
      console.error('Failed to forward support message:', e.message);
    }
  }

  await sendMessage(jid,
    `✅ *Message Sent!*\n\n` +
    `Our team has received your message and will get back to you shortly.\n\n` +
    `📞 *Business Hours:*\n` +
    `Mon–Sat: 8:00 AM – 8:00 PM EAT\n` +
    `Sunday: 10:00 AM – 5:00 PM EAT\n\n` +
    `_We typically respond within 30 minutes._\n\n` +
    `Reply *MENU* to go back to the main menu.` + FOOTER
  );

  session.state = 'MAIN_MENU';
  await session.save();
}
