// src/controllers/adminController.js - Extended version
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Campaign from '../models/Campaign.js';
import Withdrawal from '../models/Withdrawal.js';
import AffiliateLink from '../models/AffiliateLink.js';
import { ok } from '../utils/response.js';
import { paginate } from '../utils/pagination.js';

export const stats = async (req, res, next) => {
  try {
    const [
      users, 
      products, 
      orders, 
      revenue,
      affiliateLinks,
      campaigns,
      pendingWithdrawals
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: 'paid' }),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
      ]),
      AffiliateLink.countDocuments(),
      Campaign.countDocuments(),
      Withdrawal.countDocuments({ status: 'pending' })
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    ok(res, {
      users,
      products,
      paidOrders: orders,
      grossRevenue: revenue[0]?.total || 0,
      affiliateLinks,
      campaigns,
      pendingWithdrawals,
      usersByRole
    });
  } catch (e) { next(e); }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    let query = User.find();
    if (role) query = query.find({ role });
    if (search) {
      query = query.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    const users = await paginate(query, { page: +page, limit: +limit })
      .select('-password')
      .exec();
    
    ok(res, users);
  } catch (e) { next(e); }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { verified, role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { verified, role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    ok(res, user, 'User updated');
  } catch (e) { next(e); }
};

export const approveProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { status, rejectionReason } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { status, rejection_reason: rejectionReason },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    ok(res, product, `Product ${status}`);
  } catch (e) { next(e); }
};

export const processWithdrawal = async (req, res, next) => {
  try {
    const { withdrawalId } = req.params;
    const { status, failureReason, referenceNumber } = req.body;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }
    
    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    if (failureReason) withdrawal.failureReason = failureReason;
    if (referenceNumber) withdrawal.referenceNumber = referenceNumber;
    
    await withdrawal.save();
    
    // If failed, refund to wallet
    if (status === 'failed') {
      await User.findByIdAndUpdate(
        withdrawal.user,
        { $inc: { walletBalance: withdrawal.amount } }
      );
    }
    
    ok(res, withdrawal, 'Withdrawal processed');
  } catch (e) { next(e); }
};