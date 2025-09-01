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