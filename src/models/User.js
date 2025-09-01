// Updated src/models/User.js - Add wishlist field
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer','vendor','affiliate','influencer','admin'], default: 'customer' },
  walletBalance: { type: Number, default: 0 },
  avatar: String,
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [{
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
  variantId: String,
  addedAt: { type: Date, default: Date.now }
}],
  profile: {
    bio: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    socialLinks: {
      instagram: String,
      twitter: String,
      youtube: String,
      tiktok: String
    }
  },
  verified: { type: Boolean, default: false },
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(plain) { 
  return bcrypt.compare(plain, this.password); 
};

export default mongoose.model('User', userSchema);