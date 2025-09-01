// src/controllers/vendorController.js
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Withdrawal from '../models/Withdrawal.js';
import { ok } from '../utils/response.js';
import { paginate } from '../utils/pagination.js';

export const dashboard = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    const [totalProducts, totalOrders, totalRevenue, pendingWithdrawals] = await Promise.all([
      Product.countDocuments({ vendor: vendorId }),
      Order.countDocuments({ 
        'items.product': { $in: await Product.find({ vendor: vendorId }).select('_id') }
      }),
      Order.aggregate([
        { 
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $match: { 'productDetails.vendor': mongoose.Types.ObjectId(vendorId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$vendorPayout' } } }
      ]),
      Withdrawal.aggregate([
        { $match: { user: mongoose.Types.ObjectId(vendorId), status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    ok(res, {
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingWithdrawals: pendingWithdrawals[0]?.total || 0,
      availableBalance: req.user.walletBalance || 0
    });
  } catch (e) { next(e); }
};

export const myProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = Product.find({ vendor: req.user.id });
    if (status) {
      query = query.find({ status });
    }
    
    const products = await paginate(query, { page: +page, limit: +limit }).exec();
    ok(res, products);
  } catch (e) { next(e); }
};

export const myOrders = async (req, res, next) => {
  try {
    const vendorProducts = await Product.find({ vendor: req.user.id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    const orders = await Order.find({
      'items.product': { $in: productIds },
      status: 'paid'
    })
    .populate('customer', 'name email')
    .populate('items.product', 'name price')
    .sort({ createdAt: -1 });
    
    ok(res, orders);
  } catch (e) { next(e); }
};

export const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, accountDetails } = req.body;
    
    const user = await User.findById(req.user.id);
    if (user.walletBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }
    
    const withdrawal = await Withdrawal.create({
      user: req.user.id,
      amount,
      method,
      accountDetails
    });
    
    // Deduct from wallet balance
    user.walletBalance -= amount;
    await user.save();
    
    ok(res, withdrawal, 'Withdrawal request submitted');
  } catch (e) { next(e); }
};