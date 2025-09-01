// src/models/Withdrawal.js
import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { 
    type: String, 
    enum: ['bank_transfer', 'paypal', 'stripe'], 
    required: true 
  },
  accountDetails: {
    accountNumber: String,
    bankName: String,
    paypalEmail: String,
    stripeAccountId: String
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  processedAt: Date,
  failureReason: String,
  referenceNumber: String
}, { timestamps: true });

export default mongoose.model('Withdrawal', withdrawalSchema);