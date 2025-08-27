import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const affiliateLinkSchema = new mongoose.Schema({
  code: { type: String, unique: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
}, { timestamps: true });

affiliateLinkSchema.pre('validate', function(next) { if (!this.code) this.code = uuid().slice(0,8); next(); });

export default mongoose.model('AffiliateLink', affiliateLinkSchema);
