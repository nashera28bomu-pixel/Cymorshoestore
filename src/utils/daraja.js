import axios from 'axios';

const DARAJA_BASE = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// Import callback handler from your routes folder
import { handleMpesaCallback } from '../routes/mpesa.js';

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  try {
    const res = await axios.get(
      `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${credentials}` } }
    );
    return res.data.access_token;
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('Daraja OAuth error:', JSON.stringify(detail));
    throw new Error(`OAuth failed: ${JSON.stringify(detail)}`);
  }
}

function getTimestamp() {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
}

function normalizePhone(phone) {
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (p.startsWith('7') || p.startsWith('1')) p = '254' + p;
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

export async function initiateSTKPush(phone, amount, orderId) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const isProduction = process.env.MPESA_ENV === 'production';

  if (!shortcode || !passkey) {
    throw new Error('MPESA_SHORTCODE or MPESA_PASSKEY missing from environment');
  }

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const normalizedPhone = normalizePhone(phone);
  const stkPhone = !isProduction
    ? (process.env.MPESA_TEST_PHONE || '254708374149')
    : normalizedPhone;

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: stkPhone,
    PartyB: shortcode,
    PhoneNumber: stkPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: `SOLEZ-${orderId}`,
    TransactionDesc: `SOLEZ KE Order ${orderId}`
  };

  console.log('STK Push payload:', JSON.stringify({ ...payload, Password: '***' }));

  try {
    const res = await axios.post(
      `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('STK Push response:', JSON.stringify(res.data));

    // AUTO-CONFIRM IN SANDBOX MODE
    if (!isProduction && res.data.CheckoutRequestID) {
      setTimeout(() => {
        const fakeCallback = {
          Body: {
            stkCallback: {
              MerchantRequestID: res.data.MerchantRequestID,
              CheckoutRequestID: res.data.CheckoutRequestID,
              ResultCode: 0,
              ResultDesc: 'Success - Sandbox Auto Confirm',
              CallbackMetadata: {
                Item: [
                  { Name: 'Amount', Value: Math.ceil(amount) },
                  { Name: 'MpesaReceiptNumber', Value: `TEST${Date.now()}` },
                  { Name: 'PhoneNumber', Value: parseInt(stkPhone) }
                ]
              }
            }
          }
        };
        console.log('SANDBOX: Auto-triggering callback for order', orderId);
        handleMpesaCallback(fakeCallback);
      }, 3000);
    }

    return res.data;
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('STK Push failed:', JSON.stringify(detail));
    throw new Error(typeof detail === 'object' ? JSON.stringify(detail) : detail);
  }
}
