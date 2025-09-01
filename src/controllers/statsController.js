// src/controllers/statsController.js
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AffiliateLink from '../models/AffiliateLink.js';
import { ok } from '../utils/response.js';

export const platformStats = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 365;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      newUsersThisPeriod,
      ordersThisPeriod,
      topCategories,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ active: true, status: 'approved' }),
      Order.countDocuments({ status: 'paid' }),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
      ]),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments({ 
        status: 'paid', 
        createdAt: { $gte: startDate } 
      }),
      Product.aggregate([
        { $match: { active: true, status: 'approved' } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
        { $group: { 
          _id: '$category', 
          name: { $first: '$categoryInfo.name' },
          count: { $sum: 1 },
          totalSales: { $sum: '$salesCount' }
        }},
        { $sort: { totalSales: -1 } },
        { $limit: 5 }
      ]),
      Order.find({ status: 'paid' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('customer', 'name')
        .populate('items.product', 'name price')
    ]);
    
    ok(res, {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        newUsersThisPeriod,
        ordersThisPeriod
      },
      topCategories,
      recentActivity,
      period
    });
  } catch (e) { next(e); }
};