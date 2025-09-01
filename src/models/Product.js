
// Updated src/models/Product.js - Add more fields
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  comparePrice: { type: Number }, // Original price for discount display
  images: [{ type: String }],
  videos: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commission_rate: { type: Number, default: 0.1 },
  stock_quantity: { type: Number, default: 0 },
  sku: { type: String, unique: true, sparse: true },
  tags: [{ type: String }],
  specifications: { type: Object },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: 'pending'
  },
  rejection_reason: { type: String },
  active: { type: Boolean, default: true },
  weight: { type: Number }, // for shipping calculations
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  seoTitle: String,
  seoDescription: String,
  variants: [{
    name: String,
    options: [String],
    priceModifier: { type: Number, default: 0 },
    stockQuantity: { type: Number, default: 0 }
  }]
}, { timestamps: true });

// Create text index for search
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

productSchema.index({ category: 1, price: 1 });
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ featured: -1, createdAt: -1 });

export default mongoose.model('Product', productSchema);