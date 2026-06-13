import express from 'express';
import Order from '../models/Order.js';
import { sendMessage } from '../bot/index.js';
import { formatCurrency, formatDate, FOOTER } from '../utils/helpers.js';

const router = express.Router();

const STATUS_MESSAGES = {
  PROCESSING: (order) =>
    `⚙️ *Order Update — ${order.orderId}*\n\n` +
    `Your order is now being *processed & packed*! 📦\n\n` +
    `We're getting your shoes ready for dispatch.\n\n` +
    `Track anytime: Reply *TRACK ${order.orderId}*` + FOOTER,

  SHIPPED: (order) =>
    `🚚 *Your Order is On The Way!*\n\n` +
    `Order *${order.orderId}* has been *shipped*! 🎉\n\n` +
    `📍 Delivering to: ${order.delivery.county}, ${order.delivery.address}\n\n` +
    `Expected delivery: *1–3 business days*\n\n` +
    `Track anytime: Reply *TRACK ${order.orderId}*` + FOOTER,

  DELIVERED: (order) =>
    `✅ *Order Delivered!*\n\n` +
    `Your order *${order.orderId}* has been *delivered*! 🎊\n\n` +
    `We hope you love your new kicks! 👟🔥\n\n` +
    `Thank you for shopping at *SOLEZ KE*.\n` +
    `Come back anytime — Reply *MENU* to shop again!` + FOOTER,

  CANCELLED: (order) =>
    `❌ *Order Cancelled — ${order.orderId}*\n\n` +
    `Your order has been cancelled.\n\n` +
    `If you believe this is an error, please contact our support.\n` +
    `Reply *4* from the main menu or send *MENU*.` + FOOTER
};

// GET all orders
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderId: new RegExp(search, 'i') },
        { 'customer.name': new RegExp(search, 'i') },
        { 'customer.phone': new RegExp(search, 'i') },
        { mpesaRef: new RegExp(search, 'i') }
      ];
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || ''
    });
    await order.save();

    // Send WhatsApp notification to customer
    const msgFn = STATUS_MESSAGES[status];
    if (msgFn) {
      try {
        await sendMessage(`${order.customer.phone}@s.whatsapp.net`, msgFn(order));
      } catch (e) {
        console.error('WhatsApp notify error:', e.message);
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
