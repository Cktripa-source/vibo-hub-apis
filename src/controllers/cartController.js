// src/controllers/cartController.js
import User from '../models/User.js';
import Product from '../models/Product.js';
import { ok } from '../utils/response.js';

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user.cart) user.cart = [];
    
    // Check if item already in cart
    const existingItem = user.cart.find(item => 
      item.product.toString() === productId && 
      (!variantId || item.variantId === variantId)
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ 
        product: productId, 
        quantity, 
        variantId,
        addedAt: new Date()
      });
    }
    
    await user.save();
    ok(res, user.cart, 'Added to cart');
  } catch (e) { next(e); }
};

export const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name price images stock_quantity active status',
        populate: { path: 'vendor', select: 'name' }
      });
    
    // Filter out inactive or unavailable products
    const validCart = user.cart.filter(item => 
      item.product && 
      item.product.active && 
      item.product.status === 'approved'
    );
    
    const cartTotal = validCart.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    );
    
    ok(res, { items: validCart, total: cartTotal });
  } catch (e) { next(e); }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity, variantId } = req.body;
    
    const user = await User.findById(req.user.id);
    const cartItem = user.cart.find(item => 
      item.product.toString() === productId &&
      (!variantId || item.variantId === variantId)
    );
    
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }
    
    if (quantity <= 0) {
      user.cart = user.cart.filter(item => 
        !(item.product.toString() === productId && 
          (!variantId || item.variantId === variantId))
      );
    } else {
      cartItem.quantity = quantity;
    }
    
    await user.save();
    ok(res, user.cart, 'Cart updated');
  } catch (e) { next(e); }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { variantId } = req.query;
    
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(item => 
      !(item.product.toString() === productId && 
        (!variantId || item.variantId === variantId))
    );
    
    await user.save();
    ok(res, user.cart, 'Removed from cart');
  } catch (e) { next(e); }
};

export const clearCart = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { cart: [] });
    ok(res, [], 'Cart cleared');
  } catch (e) { next(e); }
};