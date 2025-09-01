// src/controllers/wishlistController.js
import User from '../models/User.js';
import Product from '../models/Product.js';
import { ok } from '../utils/response.js';

export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { wishlist: productId } }
    );
    
    ok(res, null, 'Added to wishlist');
  } catch (e) { next(e); }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { wishlist: productId } }
    );
    
    ok(res, null, 'Removed from wishlist');
  } catch (e) { next(e); }
};

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'wishlist',
        populate: { path: 'vendor', select: 'name' }
      });
    
    ok(res, user.wishlist || []);
  } catch (e) { next(e); }
};