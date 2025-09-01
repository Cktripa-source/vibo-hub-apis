// src/controllers/walletController.js
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import { ok } from '../utils/response.js';

export const getBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    ok(res, { balance: user.walletBalance || 0 });
  } catch (e) { next(e); }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    let query = Transaction.find({ user: req.user.id });
    if (type) {
      query = query.find({ type });
    }
    
    const transactions = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments({ user: req.user.id });
    
    ok(res, { transactions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { next(e); }
};

export const getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    ok(res, withdrawals);
  } catch (e) { next(e); }
};