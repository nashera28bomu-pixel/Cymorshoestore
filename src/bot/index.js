import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';

import { Boom } from '@hapi/boom';
import pino from 'pino';
import mongoose from 'mongoose';

import { handleMessage } from './handler.js';
import { useMongoDBAuthState } from '../utils/mongoAuthState.js';

let sock = null;
let pairingRequested = false;

const PAIRING_PHONE = process.env.PAIRING_PHONE || '';

export async function startBot() {
  const { state, saveCreds } = await useMongoDBAuthState();
  const { version } = await fetchLatestBaileysVersion();

  console.log('🚀 Starting Bot...');
  console.log('📦 Registered:', state.creds.registered);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  /**
   * CONNECTION HANDLER (FIXED)
   */
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

    console.log('📡 Connection State:', connection);

    if (connection === 'open') {
      console.log('🟢 Connected');
      pairingRequested = true;
    }

    if (connection === 'close') {
      console.log('🔴 Closed');
      console.log('📄 Status Code:', statusCode);

      // ❗ IMPORTANT: INVALID SESSION
      if (statusCode === 401) {
        console.log('🧨 Session invalid — clearing auth state');

        await mongoose.connection
          .collection('authstates')
          .deleteMany({});

        pairingRequested = false;

        setTimeout(() => startBot(), 3000);
        return;
      }

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log('♻️ Reconnecting...');
        setTimeout(() => startBot(), 3000);
      } else {
        console.log('🚪 Logged out permanently — re-pair needed');
        pairingRequested = false;
      }
    }

    /**
     * 🔐 REQUEST PAIRING ONLY WHEN SOCKET IS ALIVE
     */
    if (
      connection === 'open' &&
      !state.creds.registered &&
      PAIRING_PHONE &&
      !pairingRequested
    ) {
      pairingRequested = true;

      try {
        console.log('🔄 Requesting pairing code...');

        const code = await sock.requestPairingCode(PAIRING_PHONE);

        console.log('\n🔐 PAIRING CODE:', code.match(/.{1,4}/g)?.join('-') || code);

      } catch (err) {
        console.error('❌ Pairing failed:', err.message);
        pairingRequested = false;
      }
    }
  });

  /**
   * MESSAGES
   */
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (jid?.endsWith('@g.us')) continue;

      try {
        await handleMessage(sock, msg);
      } catch (err) {
        console.error(err);
      }
    }
  });

  return sock;
}
