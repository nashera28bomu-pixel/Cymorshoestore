import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleMessage } from './handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sock = null;

// Set PAIRING_PHONE in your .env — e.g. 254712345678 (no + or spaces)
const PAIRING_PHONE = process.env.PAIRING_PHONE || '';

export async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, '../../.baileys-auth')
  );

  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,   // QR disabled — using pairing code
    browser: ['SOLEZ KE Bot', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  sock.ev.on('creds.update', saveCreds);

  // Request pairing code once socket is ready and not yet registered
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, isNewLogin }) => {
    if (connection === 'open') {
      console.log('🟢 SOLEZ KE WhatsApp Bot connected!');
      return;
    }

    if (connection === 'close') {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log('🔴 Connection closed.', shouldReconnect ? 'Reconnecting...' : 'Logged out.');

      if (shouldReconnect) {
        setTimeout(() => startBot(), 3000);
      }
      return;
    }

    // When connection is "connecting" and creds not yet registered, request pairing code
    if (
      connection === 'connecting' &&
      !sock.authState.creds.registered &&
      PAIRING_PHONE
    ) {
      // Small delay to let socket stabilize before requesting
      await new Promise(r => setTimeout(r, 3000));
      try {
        const code = await sock.requestPairingCode(PAIRING_PHONE);
        const formatted = code.match(/.{1,4}/g)?.join('-') || code;
        console.log('\n┌─────────────────────────────────┐');
        console.log('│   🔐  WHATSAPP PAIRING CODE      │');
        console.log('├─────────────────────────────────┤');
        console.log(`│        ${formatted.padEnd(25)}│`);
        console.log('├─────────────────────────────────┤');
        console.log('│  Steps:                         │');
        console.log('│  1. Open WhatsApp on your phone │');
        console.log('│  2. Settings → Linked Devices   │');
        console.log('│  3. Link a Device               │');
        console.log('│  4. Enter code above            │');
        console.log('└─────────────────────────────────┘\n');
      } catch (err) {
        console.error('❌ Failed to get pairing code:', err.message);
        console.log('💡 Make sure PAIRING_PHONE is set correctly in .env (e.g. 254712345678)');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      // Skip group messages
      const jid = msg.key.remoteJid;
      if (jid.endsWith('@g.us')) continue;

      try {
        await handleMessage(sock, msg);
      } catch (err) {
        console.error('Message handler error:', err.message);
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
    console.error(`Failed to send message to ${phone}:`, err.message);
  }
}

export async function sendImageMessage(phone, imageUrl, caption = '') {
  if (!sock) return;
  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
  try {
    await sock.sendMessage(jid, {
      image: { url: imageUrl },
      caption
    });
  } catch (err) {
    console.error(`Failed to send image to ${phone}:`, err.message);
    // Fallback to text only
    if (caption) await sendMessage(phone, caption);
  }
}

export function getSock() {
  return sock;
}
