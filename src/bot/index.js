import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';

import { Boom } from '@hapi/boom';
import pino from 'pino';

import { handleMessage } from './handler.js';
import { useMongoDBAuthState } from '../utils/mongoAuthState.js';

let sock = null;
let pairingRequested = false;

const PAIRING_PHONE = process.env.PAIRING_PHONE || '';

/**
 * 🚀 MAIN BOT START
 */
export async function startBot() {
  const { state, saveCreds } = await useMongoDBAuthState();
  const { version } = await fetchLatestBaileysVersion();

  console.log('================================');
  console.log('🚀 Starting SOLEZ KE Bot');
  console.log('📱 Pairing Phone:', PAIRING_PHONE);
  console.log('📦 Registered:', state.creds.registered);
  console.log('================================');

  sock = makeWASocket({
    version,

    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: 'silent' })
      )
    },

    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,

    browser: ['Ubuntu', 'Chrome', '122.0.0.0'],

    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  /**
   * 💾 Save credentials safely
   */
  sock.ev.on('creds.update', saveCreds);

  /**
   * 🔐 Pairing code (ONLY if needed)
   */
  if (!state.creds.registered && PAIRING_PHONE && !pairingRequested) {
    pairingRequested = true;

    setTimeout(async () => {
      try {
        if (!sock) return;

        console.log('🔄 Requesting pairing code...');

        const code = await sock.requestPairingCode(PAIRING_PHONE);

        const formatted = code.match(/.{1,4}/g)?.join('-') || code;

        console.log('\n================================');
        console.log('🔐 WHATSAPP PAIRING CODE');
        console.log('================================');
        console.log(formatted);
        console.log('================================');
        console.log('Go to WhatsApp > Linked Devices');
        console.log('================================\n');

      } catch (err) {
        console.error('❌ Pairing code error:', err.message);
        pairingRequested = false;
      }
    }, 12000);
  }

  /**
   * 📡 Connection handling
   */
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    console.log('📡 Connection State:', connection);

    if (connection === 'open') {
      console.log('🟢 WhatsApp Connected');
      pairingRequested = true;
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

      console.log('🔴 Connection Closed');
      console.log('📄 Status Code:', statusCode);

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log('♻️ Reconnecting in 5 seconds...');

        setTimeout(() => {
          startBot().catch(console.error);
        }, 5000);
      } else {
        console.log('🚪 Logged out — manual re-pair required');
        pairingRequested = false;
      }
    }
  });

  /**
   * 💬 Message handler
   */
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (jid?.endsWith('@g.us')) continue;

      try {
        await handleMessage(sock, msg);
      } catch (err) {
        console.error('Message Handler Error:', err.message);
      }
    }
  });

  return sock;
}

/**
 * 📩 Send text
 */
export async function sendMessage(phone, text) {
  if (!sock) return;

  const jid = phone.includes('@')
    ? phone
    : `${phone}@s.whatsapp.net`;

  try {
    await sock.sendMessage(jid, { text });
  } catch (err) {
    console.error(`Failed sending to ${phone}:`, err.message);
  }
}

/**
 * 🖼️ Send image
 */
export async function sendImageMessage(phone, imageUrl, caption = '') {
  if (!sock) return;

  const jid = phone.includes('@')
    ? phone
    : `${phone}@s.whatsapp.net`;

  try {
    await sock.sendMessage(jid, {
      image: { url: imageUrl },
      caption
    });

  } catch (err) {
    console.error(`Failed image send to ${phone}:`, err.message);

    if (caption) {
      await sendMessage(phone, caption);
    }
  }
}

/**
 * 🔌 Get socket
 */
export function getSock() {
  return sock;
}
