import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commission_rate: { type: Number, default: 0 },
  stock_quantity: { type: Number, default: 0 },
  sku: { type: String },
  tags: [{ type: String }],
  specifications: { type: Object },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: 'pending'
  },
  rejection_reason: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
