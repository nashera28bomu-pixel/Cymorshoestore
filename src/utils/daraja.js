import axios from 'axios';

const DARAJA_BASE = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await axios.get(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  return res.data.access_token;
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

export async function initiateSTKPush(phone, amount, orderId) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  // Normalize phone to 254XXXXXXXXX
  let normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.startsWith('0')) normalizedPhone = '254' + normalizedPhone.slice(1);
  if (!normalizedPhone.startsWith('254')) normalizedPhone = '254' + normalizedPhone;

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: normalizedPhone,
    PartyB: shortcode,
    PhoneNumber: normalizedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: `SOLEZ-${orderId}`,
    TransactionDesc: `SOLEZ KE Order ${orderId}`
  };

  const res = await axios.post(
    `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}
