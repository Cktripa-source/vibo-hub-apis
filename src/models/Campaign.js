// src/models/Campaign.js
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  influencer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  budget: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'], 
    default: 'draft' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  socialPlatforms: [{ 
    type: String, 
    enum: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin'] 
  }],
  targetAudience: {
    ageRange: { min: Number, max: Number },
    gender: { type: String, enum: ['male', 'female', 'all'] },
    interests: [String],
    location: [String]
  }
}, { timestamps: true });

export default mongoose.model('Campaign', campaignSchema);