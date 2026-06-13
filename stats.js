import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayOrders, weekOrders, monthOrders,
      totalOrders, totalProducts, totalCustomers,
      pendingOrders, processingOrders, shippedOrders,
      revenueToday, revenueWeek, revenueMonth,
      topProducts, recentOrders, dailyRevenue
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments(),
      Order.countDocuments({ status: 'PENDING' }),
      Order.countDocuments({ status: 'PROCESSING' }),
      Order.countDocuments({ status: 'SHIPPED' }),

      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      Product.find({ isActive: true }).sort({ totalSold: -1 }).limit(5).select('name totalSold price category'),

      Order.find().sort({ createdAt: -1 }).limit(5),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek },
            status: { $ne: 'CANCELLED' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Africa/Nairobi' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      orders: { today: todayOrders, week: weekOrders, month: monthOrders, total: totalOrders },
      revenue: {
        today: revenueToday[0]?.total || 0,
        week: revenueWeek[0]?.total || 0,
        month: revenueMonth[0]?.total || 0
      },
      status: { pending: pendingOrders, processing: processingOrders, shipped: shippedOrders },
      products: totalProducts,
      customers: totalCustomers,
      topProducts,
      recentOrders,
      dailyRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
