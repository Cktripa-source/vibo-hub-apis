
// src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['order', 'payment', 'product', 'campaign', 'system'], 
    required: true 
  },
  read: { type: Boolean, default: false },
  data: { type: Object } // Additional metadata
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);