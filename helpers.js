import Order from '../models/Order.js';

export async function generateOrderId() {
  const count = await Order.countDocuments();
  return `ORD-${String(count + 1).padStart(4, '0')}`;
}

export function formatCurrency(amount) {
  return `KES ${Number(amount).toLocaleString('en-KE')}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatPhone(phone) {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('254')) return '0' + clean.slice(3);
  return clean;
}

export const FOOTER = '\n\n✨ _Powered by CymorTech Services_';
