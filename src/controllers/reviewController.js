// src/controllers/reviewController.js
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { ok } from '../utils/response.js';

export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    
    // Check if user has purchased this product
    const order = await Order.findOne({
      customer: req.user.id,
      'items.product': productId,
      status: 'paid'
    });
    
    if (!order) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only review products you have purchased' 
      });
    }

    const review = await Review.create({
      product: productId,
      customer: req.user.id,
      rating,
      comment,
      verified: true
    });

    // Update product average rating
    await updateProductRating(productId);
    
    ok(res, review, 'Review created');
  } catch (e) { 
    if (e.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'You have already reviewed this product' 
      });
    }
    next(e); 
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ product: productId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ product: productId });
    
    ok(res, { reviews, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { next(e); }
};

async function updateProductRating(productId) {
  const result = await Review.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: result[0].avgRating,
      totalReviews: result[0].totalReviews
    });
  }
}