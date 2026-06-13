import Session from '../models/Session.js';
import User from '../models/User.js';
import { sendMessage, sendImageMessage } from './index.js';
import { handleMainMenu } from './menus/main.js';
import { handleShopFlow } from './menus/shop.js';
import { handleCartFlow } from './menus/cart.js';
import { handleCheckoutFlow } from './menus/checkout.js';
import { handleTrackFlow } from './menus/track.js';
import { handleSupportFlow } from './menus/support.js';
import { FOOTER } from '../utils/helpers.js';

function extractText(msg) {
  const m = msg.message;
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.buttonsResponseMessage?.selectedButtonId ||
    m?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  ).trim();
}

function extractPhone(jid) {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
}

export async function handleMessage(sock, msg) {
  const jid = msg.key.remoteJid;
  const phone = extractPhone(jid);
  const text = extractText(msg).toLowerCase();

  if (!text) return;

  // Mark as read
  await sock.readMessages([msg.key]);

  // Get or create session
  let session = await Session.findOne({ phone });
  if (!session) {
    session = new Session({ phone });
  }
  session.lastActive = new Date();
  session.abandonmentNotified = false;

  // Get or create user
  let user = await User.findOne({ phone });
  if (!user) {
    user = new User({ phone });
    await user.save();
  } else {
    user.lastSeen = new Date();
    await user.save();
  }

  // Global commands (work from any state)
  if (['hi', 'hello', 'hey', 'menu', 'start', 'hii', 'habari', 'sasa'].includes(text)) {
    session.state = 'MAIN_MENU';
    session.subState = null;
    await session.save();
    return handleMainMenu(sock, jid, session, user, true);
  }

  if (text === 'cart') {
    session.state = 'CART';
    session.subState = null;
    await session.save();
    return handleCartFlow(sock, jid, session, user, text);
  }

  if (text === '0' || text === 'back') {
    session.state = 'MAIN_MENU';
    session.subState = null;
    await session.save();
    return handleMainMenu(sock, jid, session, user, false);
  }

  // Route by state
  await session.save();

  switch (session.state) {
    case 'IDLE':
    case 'MAIN_MENU':
      return handleMainMenu(sock, jid, session, user, false, text);

    case 'SHOP':
    case 'BROWSING_CATEGORY':
    case 'BROWSING_PRODUCT':
    case 'SELECTING_SIZE':
      return handleShopFlow(sock, jid, session, user, text);

    case 'CART':
      return handleCartFlow(sock, jid, session, user, text);

    case 'CHECKOUT':
    case 'AWAITING_NAME':
    case 'AWAITING_COUNTY':
    case 'AWAITING_ADDRESS':
    case 'AWAITING_CONFIRM':
    case 'AWAITING_MPESA_PHONE':
    case 'AWAITING_PAYMENT':
      return handleCheckoutFlow(sock, jid, session, user, text);

    case 'TRACK':
      return handleTrackFlow(sock, jid, session, user, text);

    case 'SUPPORT':
      return handleSupportFlow(sock, jid, session, user, text);

    default:
      session.state = 'MAIN_MENU';
      await session.save();
      return handleMainMenu(sock, jid, session, user, true);
  }
}
