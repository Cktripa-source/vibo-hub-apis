import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  verified: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent duplicate reviews
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);