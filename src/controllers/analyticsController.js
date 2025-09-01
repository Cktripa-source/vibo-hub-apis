import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AffiliateLink from '../models/AffiliateLink.js';
import User from '../models/User.js';
import { ok } from '../utils/response.js';
import { generateAnalyticsReport } from '../utils/analytics.js';

export const vendorAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const vendorId = req.user.id;
    
    // Get vendor's products
    const vendorProducts = await Product.find({ vendor: vendorId }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const matchFilter = {
      'items.product': { $in: productIds },
      status: 'paid'
    };
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }
    
    const orders = await Order.find(matchFilter)
      .populate('items.product', 'name price');
    
    const analytics = generateAnalyticsReport(orders);
    
    // Additional vendor-specific metrics
    const totalProducts = await Product.countDocuments({ vendor: vendorId });
    const activeProducts = await Product.countDocuments({ 
      vendor: vendorId, 
      active: true, 
      status: 'approved' 
    });
    
    ok(res, {
      ...analytics,
      totalProducts,
      activeProducts,
      conversionRate: analytics.totalOrders > 0 ? 
        (analytics.totalOrders / (analytics.totalOrders * 10)) * 100 : 0 // Simplified calc
    });
  } catch (e) { next(e); }
};

export const affiliateAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const affiliateId = req.user.id;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const links = await AffiliateLink.find({ affiliate: affiliateId })
      .populate('product', 'name price vendor');
    
    const linkIds = links.map(l => l._id);
    
    const matchFilter = {
      affiliateLink: { $in: linkIds },
      status: 'paid'
    };
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }
    
    const orders = await Order.find(matchFilter);
    
    const analytics = {
      totalLinks: links.length,
      totalClicks: links.reduce((sum, link) => sum + link.clicks, 0),
      totalConversions: links.reduce((sum, link) => sum + link.conversions, 0),
      totalCommissions: orders.reduce((sum, order) => sum + order.affiliatePayout, 0),
      conversionRate: 0,
      topPerformingLinks: links
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 5)
        .map(link => ({
          code: link.code,
          product: link.product.name,
          clicks: link.clicks,
          conversions: link.conversions,
          conversionRate: link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0
        }))
    };
    
    analytics.conversionRate = analytics.totalClicks > 0 ? 
      (analytics.totalConversions / analytics.totalClicks) * 100 : 0;
    
    ok(res, analytics);
  } catch (e) { next(e); }
};