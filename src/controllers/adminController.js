import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { ok } from '../utils/response.js';

export const stats = async (req, res, next) => {
  try {
    const [users, products, orders, revenue] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: 'paid' }),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
      ])
    ]);

    ok(res, {
      users,
      products,
      paidOrders: orders,
      grossRevenue: revenue[0]?.total || 0
    });
  } catch (e) { next(e); }
};
