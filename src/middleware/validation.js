// src/middleware/validation.js
import { body, param, query } from 'express-validator';

export const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('commission_rate').optional().isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 1')
];

export const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('affiliateCode').optional().isString()
];

export const campaignValidation = [
  body('title').notEmpty().withMessage('Campaign title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be positive'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required')
];

export const reviewValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Review comment is required')
];

export const withdrawalValidation = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('method').isIn(['bank_transfer', 'paypal', 'stripe']).withMessage('Invalid withdrawal method'),
  body('accountDetails').isObject().withMessage('Account details required')
];

// src/controllers/settingsController.js
import User from '../models/User.js';
import { ok } from '../utils/response.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    ok(res, user);
  } catch (e) { next(e); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'avatar', 'profile.bio', 'profile.phone', 
      'profile.address', 'profile.socialLinks'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) || key.startsWith('profile.')) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    ok(res, user, 'Profile updated');
  } catch (e) { next(e); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    const isValid = await user.comparePassword(currentPassword);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    ok(res, null, 'Password changed successfully');
  } catch (e) { next(e); }
};
