import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  subtotal: Number,
  affiliateLink: { type: mongoose.Schema.Types.ObjectId, ref: 'AffiliateLink' },
  vendorPayout: Number,
  affiliatePayout: Number,
  platformFee: Number,
  status: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  paymentProvider: { type: String, enum: ['stripe','paypal','manual'], default: 'manual' },
  paymentRef: String,
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
