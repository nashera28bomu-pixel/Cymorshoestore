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

export async function startBot() {
  const { state, saveCreds } = await useMongoDBAuthState();
  const { version } = await fetchLatestBaileysVersion();

  console.log('📦 Registered:', state.creds.registered);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '122.0.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, isOnline }) => {

    if (connection === 'open') {
      console.log('🟢 WhatsApp Connected — session saved to MongoDB');
      pairingRequested = true;
      return;
    }

    // ✅ Request pairing code ONLY when connecting and not yet registered
    if (connection === 'connecting') {
      if (!state.creds.registered && PAIRING_PHONE && !pairingRequested) {
        pairingRequested = true;
        // Wait 5s for socket handshake to complete before requesting
        setTimeout(async () => {
          try {
            console.log('🔄 Requesting pairing code for', PAIRING_PHONE);
            const code = await sock.requestPairingCode(PAIRING_PHONE);
            const formatted = code.match(/.{1,4}/g)?.join('-') || code;
            console.log('\n================================');
            console.log('🔐 WHATSAPP PAIRING CODE:', formatted);
            console.log('================================');
            console.log('WhatsApp → Settings → Linked Devices → Link a Device → Enter code\n');
          } catch (err) {
            console.error('❌ Pairing code error:', err?.message || err);
            pairingRequested = false; // allow retry on next reconnect
          }
        }, 5000);
      }
      return;
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log('🔴 Connection Closed', shouldReconnect ? '- Reconnecting...' : '- Logged Out');

      if (shouldReconnect) {
        pairingRequested = false;
        setTimeout(() => startBot(), 5000);
      }
    }
  });

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

export async function sendMessage(phone, text) {
  if (!sock) return;
  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
  try {
    await sock.sendMessage(jid, { text });
  } catch (err) {
    console.error(`Failed sending to ${phone}:`, err.message);
  }
}

export async function sendImageMessage(phone, imageUrl, caption = '') {
  if (!sock) return;
  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
  try {
    await sock.sendMessage(jid, { image: { url: imageUrl }, caption });
  } catch (err) {
    console.error(`Failed image send to ${phone}:`, err.message);
    if (caption) await sendMessage(phone, caption);
  }
}

export function getSock() {
  return sock;
}
