import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AffiliateLink from '../models/AffiliateLink.js';
import { ok } from '../utils/response.js';
import * as stripeSvc from '../services/payments/stripe.js';
import * as paypalSvc from '../services/payments/paypal.js';

function computeBreakdown(items, affiliateCommissionRate = null) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const platformFeeRate = 0.05;
  const affiliateRate = affiliateCommissionRate ?? 0.1;
  const affiliatePayout = subtotal * affiliateRate;
  const platformFee = subtotal * platformFeeRate;
  const vendorPayout = subtotal - affiliatePayout - platformFee;
  return { subtotal, affiliatePayout, platformFee, vendorPayout };
}

export const createOrder = async (req, res, next) => {
  try {
    const { items, affiliateCode, provider = 'manual' } = req.body;
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const map = new Map(products.map(p => [String(p._id), p]));

    const orderItems = items.map(i => ({
      product: i.product,
      quantity: i.quantity,
      price: map.get(String(i.product)).price
    }));

    let affiliateLink = null; let affRate = null;
    if (affiliateCode) {
      affiliateLink = await AffiliateLink.findOne({ code: affiliateCode }).populate('product');
      if (affiliateLink) {
        affRate = affiliateLink.product.affiliateCommission;
      }
    }

    const breakdown = computeBreakdown(orderItems, affRate);

    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      subtotal: breakdown.subtotal,
      affiliateLink: affiliateLink?._id,
      vendorPayout: breakdown.vendorPayout,
      affiliatePayout: breakdown.affiliatePayout,
      platformFee: breakdown.platformFee,
      paymentProvider: provider
    });

    let paymentData = null;
    if (provider === 'stripe') paymentData = await stripeSvc.createPaymentIntent(order);
    if (provider === 'paypal') paymentData = await paypalSvc.createOrder(order);

    ok(res, { orderId: order._id, subtotal: breakdown.subtotal, payment: paymentData }, 'Order created');
  } catch (e) { next(e); }
};

export const markPaid = async (req, res, next) => {
  try {
    const { orderId, reference } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = 'paid';
    order.paymentRef = reference;
    await order.save();

    if (order.affiliateLink) {
      const link = await AffiliateLink.findById(order.affiliateLink);
      link.conversions += 1; await link.save();
    }

    ok(res, { orderId: order._id }, 'Payment marked as paid');
  } catch (e) { next(e); }
};

export const myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).populate('items.product','title price');
    ok(res, orders);
  } catch (e) { next(e); }
};
