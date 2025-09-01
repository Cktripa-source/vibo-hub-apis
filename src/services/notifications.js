// src/services/notifications.js
import Notification from '../models/Notification.js';

export async function createNotification(userId, title, message, type, data = null) {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      data
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function notifyOrderCreated(order) {
  await createNotification(
    order.customer,
    'Order Confirmed',
    `Your order #${order._id.toString().slice(-8)} has been created.`,
    'order',
    { orderId: order._id }
  );
}

export async function notifyPaymentReceived(order) {
  await createNotification(
    order.customer,
    'Payment Confirmed',
    `Payment for order #${order._id.toString().slice(-8)} has been confirmed.`,
    'payment',
    { orderId: order._id }
  );
}