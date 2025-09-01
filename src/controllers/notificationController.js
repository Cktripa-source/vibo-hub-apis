// src/controllers/notificationController.js
import Notification from '../models/Notification.js';
import { ok } from '../utils/response.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    
    let query = Notification.find({ user: req.user.id });
    if (unread === 'true') {
      query = query.find({ read: false });
    }
    
    const notifications = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments({ user: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });
    
    ok(res, { notifications, total, unreadCount });
  } catch (e) { next(e); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    ok(res, notification, 'Notification marked as read');
  } catch (e) { next(e); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    ok(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
};