// .env.example
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/ecommerce_db
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRES_IN=30d
BASE_URL=http://localhost:4000

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# File Upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional)
EMAIL_FROM=noreply@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

// src/middleware/upload.js
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

// src/models/Review.js
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

// src/controllers/influencerController.js
import Campaign from '../models/Campaign.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { ok } from '../utils/response.js';

export const createCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      influencer: req.user.id
    });
    ok(res, campaign, 'Campaign created');
  } catch (e) { next(e); }
};

export const myCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ influencer: req.user.id })
      .populate('vendor', 'name')
      .populate('products', 'name price');
    ok(res, campaigns);
  } catch (e) { next(e); }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, influencer: req.user.id },
      req.body,
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    ok(res, campaign, 'Campaign updated');
  } catch (e) { next(e); }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ 
      _id: req.params.id, 
      influencer: req.user.id 
    });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    ok(res, campaign, 'Campaign deleted');
  } catch (e) { next(e); }
};

export const availableVendors = async (req, res, next) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('name email avatar');
    ok(res, vendors);
  } catch (e) { next(e); }
};

// src/controllers/reviewController.js
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { ok } from '../utils/response.js';

export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    
    // Check if user has purchased this product
    const order = await Order.findOne({
      customer: req.user.id,
      'items.product': productId,
      status: 'paid'
    });
    
    if (!order) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only review products you have purchased' 
      });
    }

    const review = await Review.create({
      product: productId,
      customer: req.user.id,
      rating,
      comment,
      verified: true
    });

    // Update product average rating
    await updateProductRating(productId);
    
    ok(res, review, 'Review created');
  } catch (e) { 
    if (e.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'You have already reviewed this product' 
      });
    }
    next(e); 
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ product: productId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ product: productId });
    
    ok(res, { reviews, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { next(e); }
};

async function updateProductRating(productId) {
  const result = await Review.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: result[0].avgRating,
      totalReviews: result[0].totalReviews
    });
  }
}

// src/controllers/vendorController.js
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Withdrawal from '../models/Withdrawal.js';
import { ok } from '../utils/response.js';
import { paginate } from '../utils/pagination.js';

export const dashboard = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    const [totalProducts, totalOrders, totalRevenue, pendingWithdrawals] = await Promise.all([
      Product.countDocuments({ vendor: vendorId }),
      Order.countDocuments({ 
        'items.product': { $in: await Product.find({ vendor: vendorId }).select('_id') }
      }),
      Order.aggregate([
        { 
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $match: { 'productDetails.vendor': mongoose.Types.ObjectId(vendorId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$vendorPayout' } } }
      ]),
      Withdrawal.aggregate([
        { $match: { user: mongoose.Types.ObjectId(vendorId), status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    ok(res, {
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingWithdrawals: pendingWithdrawals[0]?.total || 0,
      availableBalance: req.user.walletBalance || 0
    });
  } catch (e) { next(e); }
};

export const myProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = Product.find({ vendor: req.user.id });
    if (status) {
      query = query.find({ status });
    }
    
    const products = await paginate(query, { page: +page, limit: +limit }).exec();
    ok(res, products);
  } catch (e) { next(e); }
};

export const myOrders = async (req, res, next) => {
  try {
    const vendorProducts = await Product.find({ vendor: req.user.id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    const orders = await Order.find({
      'items.product': { $in: productIds },
      status: 'paid'
    })
    .populate('customer', 'name email')
    .populate('items.product', 'name price')
    .sort({ createdAt: -1 });
    
    ok(res, orders);
  } catch (e) { next(e); }
};

export const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, accountDetails } = req.body;
    
    const user = await User.findById(req.user.id);
    if (user.walletBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }
    
    const withdrawal = await Withdrawal.create({
      user: req.user.id,
      amount,
      method,
      accountDetails
    });
    
    // Deduct from wallet balance
    user.walletBalance -= amount;
    await user.save();
    
    ok(res, withdrawal, 'Withdrawal request submitted');
  } catch (e) { next(e); }
};

// src/controllers/notificationController.js
import Notification from '../models/Notification.js';
import { ok } from '../utils/response.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    
    let query = Notification.find({ user: req.user.id });
    if (unread === 'true') {
      query = query.find({ read: false });
    }
    
    const notifications = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments({ user: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });
    
    ok(res, { notifications, total, unreadCount });
  } catch (e) { next(e); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    ok(res, notification, 'Notification marked as read');
  } catch (e) { next(e); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    ok(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
};

// src/controllers/searchController.js
import Product from '../models/Product.js';
import { ok } from '../utils/response.js';

export const searchProducts = async (req, res, next) => {
  try {
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1, 
      limit = 20 
    } = req.query;

    let query = Product.find({ active: true, status: 'approved' });

    // Text search
    if (q) {
      query = query.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      });
    }

    // Category filter
    if (category) {
      query = query.find({ category });
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      query = query.find({ price: priceFilter });
    }

    // Sorting
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    query = query.sort(sortObj);

    // Pagination
    const skip = (page - 1) * limit;
    const products = await query
      .skip(skip)
      .limit(parseInt(limit))
      .populate('vendor', 'name')
      .populate('category', 'name');

    const total = await Product.countDocuments(query.getQuery());

    ok(res, {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) { next(e); }
};

export const getFilters = async (req, res, next) => {
  try {
    const [categories, priceRange, tags] = await Promise.all([
      Product.aggregate([
        { $match: { active: true, status: 'approved' } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
        { $group: { _id: '$category', name: { $first: '$categoryInfo.name' }, count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        { $match: { active: true, status: 'approved' } },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
      ]),
      Product.aggregate([
        { $match: { active: true, status: 'approved' } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    ok(res, {
      categories,
      priceRange: priceRange[0] || { min: 0, max: 0 },
      popularTags: tags
    });
  } catch (e) { next(e); }
};

// src/controllers/wishlistController.js
import User from '../models/User.js';
import Product from '../models/Product.js';
import { ok } from '../utils/response.js';

export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { wishlist: productId } }
    );
    
    ok(res, null, 'Added to wishlist');
  } catch (e) { next(e); }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { wishlist: productId } }
    );
    
    ok(res, null, 'Removed from wishlist');
  } catch (e) { next(e); }
};

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'wishlist',
        populate: { path: 'vendor', select: 'name' }
      });
    
    ok(res, user.wishlist || []);
  } catch (e) { next(e); }
};

// src/routes/influencerRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { 
  createCampaign, 
  myCampaigns, 
  updateCampaign, 
  deleteCampaign,
  availableVendors 
} from '../controllers/influencerController.js';

const router = Router();

router.post('/campaigns', auth(), permit('influencer', 'admin'), createCampaign);
router.get('/campaigns/mine', auth(), permit('influencer', 'admin'), myCampaigns);
router.put('/campaigns/:id', auth(), permit('influencer', 'admin'), updateCampaign);
router.delete('/campaigns/:id', auth(), permit('influencer', 'admin'), deleteCampaign);
router.get('/vendors', auth(), permit('influencer', 'admin'), availableVendors);

export default router;

// src/routes/vendorRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { 
  dashboard, 
  myProducts, 
  myOrders,
  requestWithdrawal 
} from '../controllers/vendorController.js';

const router = Router();

router.get('/dashboard', auth(), permit('vendor', 'admin'), dashboard);
router.get('/products', auth(), permit('vendor', 'admin'), myProducts);
router.get('/orders', auth(), permit('vendor', 'admin'), myOrders);
router.post('/withdrawals', auth(), permit('vendor', 'admin'), requestWithdrawal);

export default router;

// src/routes/reviewRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createReview, getProductReviews } from '../controllers/reviewController.js';

const router = Router();

router.post('/', auth(), createReview);
router.get('/product/:productId', getProductReviews);

export default router;

// src/routes/searchRoutes.js
import { Router } from 'express';
import { searchProducts, getFilters } from '../controllers/searchController.js';

const router = Router();

router.get('/products', searchProducts);
router.get('/filters', getFilters);

export default router;

// src/routes/notificationRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', auth(), getNotifications);
router.patch('/:id/read', auth(), markAsRead);
router.patch('/read-all', auth(), markAllAsRead);

export default router;

// src/routes/wishlistRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
  addToWishlist, 
  removeFromWishlist, 
  getWishlist 
} from '../controllers/wishlistController.js';

const router = Router();

router.post('/', auth(), addToWishlist);
router.delete('/:productId', auth(), removeFromWishlist);
router.get('/', auth(), getWishlist);

export default router;

// src/routes/uploadRoutes.js
import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';
import { ok } from '../utils/response.js';

const router = Router();

router.post('/images', auth(), upload.array('images', 5), (req, res, next) => {
  try {
    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size
    }));
    ok(res, files, 'Images uploaded successfully');
  } catch (e) { next(e); }
});

export default router;

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

// src/utils/analytics.js
export function calculateCommissionBreakdown(subtotal, commissionRate = 0.1) {
  const platformFeeRate = 0.05; // 5% platform fee
  const affiliateCommission = subtotal * commissionRate;
  const platformFee = subtotal * platformFeeRate;
  const vendorPayout = subtotal - affiliateCommission - platformFee;
  
  return {
    subtotal,
    affiliateCommission,
    platformFee,
    vendorPayout,
    commissionRate,
    platformFeeRate
  };
}

export function generateAnalyticsReport(orders, dateRange) {
  const report = {
    totalOrders: orders.length,
    totalRevenue: 0,
    averageOrderValue: 0,
    topProducts: new Map(),
    revenueByDay: new Map()
  };
  
  orders.forEach(order => {
    report.totalRevenue += order.subtotal;
    
    // Track products
    order.items.forEach(item => {
      const productId = item.product.toString();
      const current = report.topProducts.get(productId) || { 
        product: item.product, 
        quantity: 0, 
        revenue: 0 
      };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      report.topProducts.set(productId, current);
    });
    
    // Track daily revenue
    const day = order.createdAt.toISOString().split('T')[0];
    report.revenueByDay.set(day, (report.revenueByDay.get(day) || 0) + order.subtotal);
  });
  
  report.averageOrderValue = report.totalOrders > 0 ? 
    report.totalRevenue / report.totalOrders : 0;
  
  report.topProducts = Array.from(report.topProducts.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  return report;
}

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

// Updated src/server.js - Add new routes and middleware
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import influencerRoutes from './routes/influencerRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'E-commerce & Affiliate Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
  });
}).catch(e => {
  console.error('❌ DB connection failed', e);
  process.exit(1);
});

// src/controllers/walletController.js
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import { ok } from '../utils/response.js';

export const getBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    ok(res, { balance: user.walletBalance || 0 });
  } catch (e) { next(e); }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    let query = Transaction.find({ user: req.user.id });
    if (type) {
      query = query.find({ type });
    }
    
    const transactions = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments({ user: req.user.id });
    
    ok(res, { transactions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { next(e); }
};

export const getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    ok(res, withdrawals);
  } catch (e) { next(e); }
};

// src/routes/walletRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
  getBalance, 
  getTransactions, 
  getWithdrawals 
} from '../controllers/walletController.js';

const router = Router();

router.get('/balance', auth(), getBalance);
router.get('/transactions', auth(), getTransactions);
router.get('/withdrawals', auth(), getWithdrawals);

export default router;

// src/controllers/analyticsController.js
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AffiliateLink from '../models/AffiliateLink.js';
import User from '../models/User.js';
import { ok } from '../utils/response.js';
import { generateAnalyticsReport } from '../utils/analytics.js';

export const vendorAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const vendorId = req.user.id;
    
    // Get vendor's products
    const vendorProducts = await Product.find({ vendor: vendorId }).select('_id');
    const productIds = vendorProducts.map(p => p._id);
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const matchFilter = {
      'items.product': { $in: productIds },
      status: 'paid'
    };
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }
    
    const orders = await Order.find(matchFilter)
      .populate('items.product', 'name price');
    
    const analytics = generateAnalyticsReport(orders);
    
    // Additional vendor-specific metrics
    const totalProducts = await Product.countDocuments({ vendor: vendorId });
    const activeProducts = await Product.countDocuments({ 
      vendor: vendorId, 
      active: true, 
      status: 'approved' 
    });
    
    ok(res, {
      ...analytics,
      totalProducts,
      activeProducts,
      conversionRate: analytics.totalOrders > 0 ? 
        (analytics.totalOrders / (analytics.totalOrders * 10)) * 100 : 0 // Simplified calc
    });
  } catch (e) { next(e); }
};

export const affiliateAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const affiliateId = req.user.id;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const links = await AffiliateLink.find({ affiliate: affiliateId })
      .populate('product', 'name price vendor');
    
    const linkIds = links.map(l => l._id);
    
    const matchFilter = {
      affiliateLink: { $in: linkIds },
      status: 'paid'
    };
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }
    
    const orders = await Order.find(matchFilter);
    
    const analytics = {
      totalLinks: links.length,
      totalClicks: links.reduce((sum, link) => sum + link.clicks, 0),
      totalConversions: links.reduce((sum, link) => sum + link.conversions, 0),
      totalCommissions: orders.reduce((sum, order) => sum + order.affiliatePayout, 0),
      conversionRate: 0,
      topPerformingLinks: links
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 5)
        .map(link => ({
          code: link.code,
          product: link.product.name,
          clicks: link.clicks,
          conversions: link.conversions,
          conversionRate: link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0
        }))
    };
    
    analytics.conversionRate = analytics.totalClicks > 0 ? 
      (analytics.totalConversions / analytics.totalClicks) * 100 : 0;
    
    ok(res, analytics);
  } catch (e) { next(e); }
};

// src/routes/analyticsRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { vendorAnalytics, affiliateAnalytics } from '../controllers/analyticsController.js';

const router = Router();

router.get('/vendor', auth(), permit('vendor', 'admin'), vendorAnalytics);
router.get('/affiliate', auth(), permit('affiliate', 'admin'), affiliateAnalytics);

export default router;

// src/controllers/cartController.js
import User from '../models/User.js';
import Product from '../models/Product.js';
import { ok } from '../utils/response.js';

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user.cart) user.cart = [];
    
    // Check if item already in cart
    const existingItem = user.cart.find(item => 
      item.product.toString() === productId && 
      (!variantId || item.variantId === variantId)
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ 
        product: productId, 
        quantity, 
        variantId,
        addedAt: new Date()
      });
    }
    
    await user.save();
    ok(res, user.cart, 'Added to cart');
  } catch (e) { next(e); }
};

export const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'cart.product',
        select: 'name price images stock_quantity active status',
        populate: { path: 'vendor', select: 'name' }
      });
    
    // Filter out inactive or unavailable products
    const validCart = user.cart.filter(item => 
      item.product && 
      item.product.active && 
      item.product.status === 'approved'
    );
    
    const cartTotal = validCart.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    );
    
    ok(res, { items: validCart, total: cartTotal });
  } catch (e) { next(e); }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity, variantId } = req.body;
    
    const user = await User.findById(req.user.id);
    const cartItem = user.cart.find(item => 
      item.product.toString() === productId &&
      (!variantId || item.variantId === variantId)
    );
    
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }
    
    if (quantity <= 0) {
      user.cart = user.cart.filter(item => 
        !(item.product.toString() === productId && 
          (!variantId || item.variantId === variantId))
      );
    } else {
      cartItem.quantity = quantity;
    }
    
    await user.save();
    ok(res, user.cart, 'Cart updated');
  } catch (e) { next(e); }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { variantId } = req.query;
    
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(item => 
      !(item.product.toString() === productId && 
        (!variantId || item.variantId === variantId))
    );
    
    await user.save();
    ok(res, user.cart, 'Removed from cart');
  } catch (e) { next(e); }
};

export const clearCart = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { cart: [] });
    ok(res, [], 'Cart cleared');
  } catch (e) { next(e); }
};

// src/routes/cartRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
  addToCart, 
  getCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from '../controllers/cartController.js';

const router = Router();

router.post('/add', auth(), addToCart);
router.get('/', auth(), getCart);
router.put('/update', auth(), updateCartItem);
router.delete('/:productId', auth(), removeFromCart);
router.delete('/', auth(), clearCart);

export default router;

// Updated User model to include cart
// Add this to the existing User schema:
/*
cart: [{
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
  variantId: String,
  addedAt: { type: Date, default: Date.now }
}],
*/

// src/middleware/rateLimiter.js
const requests = new Map();

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 100 }) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = requests.get(key);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    record.count++;
    next();
  };
}

// src/controllers/adminController.js - Extended version
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Campaign from '../models/Campaign.js';
import Withdrawal from '../models/Withdrawal.js';
import AffiliateLink from '../models/AffiliateLink.js';
import { ok } from '../utils/response.js';
import { paginate } from '../utils/pagination.js';

export const stats = async (req, res, next) => {
  try {
    const [
      users, 
      products, 
      orders, 
      revenue,
      affiliateLinks,
      campaigns,
      pendingWithdrawals
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: 'paid' }),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
      ]),
      AffiliateLink.countDocuments(),
      Campaign.countDocuments(),
      Withdrawal.countDocuments({ status: 'pending' })
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    ok(res, {
      users,
      products,
      paidOrders: orders,
      grossRevenue: revenue[0]?.total || 0,
      affiliateLinks,
      campaigns,
      pendingWithdrawals,
      usersByRole
    });
  } catch (e) { next(e); }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    let query = User.find();
    if (role) query = query.find({ role });
    if (search) {
      query = query.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    const users = await paginate(query, { page: +page, limit: +limit })
      .select('-password')
      .exec();
    
    ok(res, users);
  } catch (e) { next(e); }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { verified, role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { verified, role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    ok(res, user, 'User updated');
  } catch (e) { next(e); }
};

export const approveProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { status, rejectionReason } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { status, rejection_reason: rejectionReason },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    ok(res, product, `Product ${status}`);
  } catch (e) { next(e); }
};

export const processWithdrawal = async (req, res, next) => {
  try {
    const { withdrawalId } = req.params;
    const { status, failureReason, referenceNumber } = req.body;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }
    
    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    if (failureReason) withdrawal.failureReason = failureReason;
    if (referenceNumber) withdrawal.referenceNumber = referenceNumber;
    
    await withdrawal.save();
    
    // If failed, refund to wallet
    if (status === 'failed') {
      await User.findByIdAndUpdate(
        withdrawal.user,
        { $inc: { walletBalance: withdrawal.amount } }
      );
    }
    
    ok(res, withdrawal, 'Withdrawal processed');
  } catch (e) { next(e); }
};

// src/routes/cartRoutes.js already defined above

// Final updated server.js with all routes
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimiter.js';

// Import all routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import influencerRoutes from './routes/influencerRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and middleware
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 })); // 1000 requests per 15 minutes
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Health checks
app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'E-commerce & Affiliate Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/analytics', analyticsRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'E-commerce & Affiliate Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      affiliates: '/api/affiliates',
      influencers: '/api/influencers',
      vendors: '/api/vendors',
      admin: '/api/admin',
      categories: '/api/categories',
      reviews: '/api/reviews',
      search: '/api/search',
      notifications: '/api/notifications',
      wishlist: '/api/wishlist',
      upload: '/api/upload',
      wallet: '/api/wallet',
      cart: '/api/cart',
      analytics: '/api/analytics'
    }
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
    console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
  });
}).catch(e => {
  console.error('❌ DB connection failed', e);
  process.exit(1);
});

// src/services/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST) {
    console.log('Email service not configured, skipping email send');
    return;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

export const emailTemplates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmation #${order._id.toString().slice(-8)}`,
    html: `
      <h2>Order Confirmed!</h2>
      <p>Your order has been successfully placed.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Total:</strong> ${order.subtotal.toFixed(2)}</p>
      <p>Thank you for your purchase!</p>
    `
  }),
  
  withdrawalApproved: (withdrawal) => ({
    subject: 'Withdrawal Approved',
    html: `
      <h2>Withdrawal Approved</h2>
      <p>Your withdrawal request has been approved and processed.</p>
      <p><strong>Amount:</strong> ${withdrawal.amount.toFixed(2)}</p>
      <p><strong>Reference:</strong> ${withdrawal.referenceNumber}</p>
    `
  }),
  
  productApproved: (product) => ({
    subject: 'Product Approved',
    html: `
      <h2>Product Approved!</h2>
      <p>Your product "${product.name}" has been approved and is now live.</p>
      <p>Start promoting it to earn sales!</p>
    `
  })
};

// src/middleware/validation.js
import { body, param, query } from 'express-validator';

export const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('commission_rate').optional().isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 1')
];

export const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('affiliateCode').optional().isString()
];

export const campaignValidation = [
  body('title').notEmpty().withMessage('Campaign title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be positive'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required')
];

export const reviewValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Review comment is required')
];

export const withdrawalValidation = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('method').isIn(['bank_transfer', 'paypal', 'stripe']).withMessage('Invalid withdrawal method'),
  body('accountDetails').isObject().withMessage('Account details required')
];

// src/controllers/settingsController.js
import User from '../models/User.js';
import { ok } from '../utils/response.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    ok(res, user);
  } catch (e) { next(e); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'avatar', 'profile.bio', 'profile.phone', 
      'profile.address', 'profile.socialLinks'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) || key.startsWith('profile.')) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    ok(res, user, 'Profile updated');
  } catch (e) { next(e); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    const isValid = await user.comparePassword(currentPassword);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    ok(res, null, 'Password changed successfully');
  } catch (e) { next(e); }
};

// src/routes/settingsRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';
import { 
  getProfile, 
  updateProfile, 
  changePassword 
} from '../controllers/settingsController.js';

const router = Router();

router.get('/profile', auth(), getProfile);
router.put('/profile', auth(), updateProfile);
router.put('/password', auth(), [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], handleValidation, changePassword);

export default router;

// src/utils/helpers.js
import { v4 as uuid } from 'uuid';

export function generateSKU(productName, vendorId) {
  const prefix = productName.substring(0, 3).toUpperCase();
  const vendorPrefix = vendorId.toString().slice(-4);
  const unique = uuid().slice(0, 8).toUpperCase();
  return `${prefix}-${vendorPrefix}-${unique}`;
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export function calculateShipping(weight, distance, method = 'standard') {
  const baseRate = 5.00;
  const weightRate = weight * 0.50;
  const distanceRate = distance * 0.01;
  const methodMultiplier = method === 'express' ? 2 : 1;
  
  return Math.max(baseRate + weightRate + distanceRate, 0) * methodMultiplier;
}

export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// src/middleware/security.js
export function sanitizeInput(req, res, next) {
  // Remove any potential XSS attempts
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
}

export function addSecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

// Updated src/controllers/productController.js with improved features
import Product from '../models/Product.js';
import { paginate } from '../utils/pagination.js';
import { ok } from '../utils/response.js';
import { generateSKU } from '../utils/helpers.js';

const normalize = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

export const list = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      q, 
      mine, 
      category, 
      featured,
      status = 'approved'
    } = req.query;

    let query = Product.find();
    
    // Filter by ownership
    if (mine) {
      query = query.find({ vendor: req.user.id });
    } else {
      // Public listings - only show approved and active
      query = query.find({ active: true, status: 'approved' });
    }
    
    // Text search
    if (q) {
      query = query.find({ $text: { $search: q } });
    }
    
    // Category filter
    if (category) {
      query = query.find({ category });
    }
    
    // Featured products
    if (featured === 'true') {
      query = query.find({ featured: true });
    }
    
    // Status filter (for vendor/admin)
    if (mine && status) {
      query = query.find({ status });
    }

    const items = await paginate(
      query.populate('vendor', 'name').populate('category', 'name'),
      { page: +page, limit: +limit }
    ).exec();

    const normalized = Array.isArray(items) ? items.map(normalize) : [];
    ok(res, normalized);
  } catch (e) {
    next(e);
  }
};

export const create = async (req, res, next) => {
  try {
    const body = { 
      ...req.body, 
      vendor: req.user.id,
      sku: req.body.sku || generateSKU(req.body.name, req.user.id)
    };
    
    const product = await Product.create(body);
    ok(res, normalize(product), 'Product created and pending approval');
  } catch (e) {
    next(e);
  }
};

export const update = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: req.user.id,
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Don't allow updating certain fields
    const { vendor, _id, createdAt, ...updates } = req.body;
    
    Object.assign(product, updates);
    await product.save();
    
    ok(res, normalize(product), 'Product updated');
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      vendor: req.user.id,
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    ok(res, normalize(product), 'Product deleted');
  } catch (e) {
    next(e);
  }
};

export const get = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name profile.bio')
      .populate('category', 'name description');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Only show active approved products to public, or own products to vendor
    if (!product.active || 
        (product.status !== 'approved' && product.vendor._id.toString() !== req.user?.id)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Increment view count (optional analytics)
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    ok(res, normalize(product));
  } catch (e) {
    next(e);
  }
};

export const getFeatured = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = await Product.find({ 
      featured: true, 
      active: true, 
      status: 'approved' 
    })
    .populate('vendor', 'name')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
    
    ok(res, products.map(normalize));
  } catch (e) {
    next(e);
  }
};

export const getRelated = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const related = await Product.find({
      _id: { $ne: id },
      category: product.category,
      active: true,
      status: 'approved'
    })
    .populate('vendor', 'name')
    .limit(parseInt(limit));
    
    ok(res, related.map(normalize));
  } catch (e) {
    next(e);
  }
};

// src/services/inventory.js
import Product from '../models/Product.js';
import { createNotification } from './notifications.js';

export async function updateStock(productId, quantity, operation = 'decrease') {
  try {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    const newQuantity = operation === 'decrease' ? 
      product.stock_quantity - quantity : 
      product.stock_quantity + quantity;
    
    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }
    
    product.stock_quantity = newQuantity;
    await product.save();
    
    // Notify vendor if stock is low
    if (newQuantity <= 5 && newQuantity > 0) {
      await createNotification(
        product.vendor,
        'Low Stock Alert',
        `Product "${product.name}" is running low on stock (${newQuantity} remaining)`,
        'product',
        { productId: product._id }
      );
    }
    
    return product;
  } catch (error) {
    console.error('Stock update failed:', error);
    throw error;
  }
}

export async function reserveStock(items) {
  const reservations = [];
  
  try {
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }
      
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      
      // Reserve stock
      product.stock_quantity -= item.quantity;
      await product.save();
      
      reservations.push({
        productId: item.product,
        quantity: item.quantity,
        reserved: true
      });
    }
    
    return reservations;
  } catch (error) {
    // Rollback reservations on failure
    for (const reservation of reservations) {
      if (reservation.reserved) {
        await Product.findByIdAndUpdate(
          reservation.productId,
          { $inc: { stock_quantity: reservation.quantity } }
        );
      }
    }
    throw error;
  }
}

// src/middleware/cache.js
const cache = new Map();

export function simpleCache(duration = 5 * 60 * 1000) { // 5 minutes default
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return originalJson.call(this, data);
    };
    
    next();
  };
}

export function clearCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// src/controllers/statsController.js
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AffiliateLink from '../models/AffiliateLink.js';
import { ok } from '../utils/response.js';

export const platformStats = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 365;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      newUsersThisPeriod,
      ordersThisPeriod,
      topCategories,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ active: true, status: 'approved' }),
      Order.countDocuments({ status: 'paid' }),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
      ]),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments({ 
        status: 'paid', 
        createdAt: { $gte: startDate } 
      }),
      Product.aggregate([
        { $match: { active: true, status: 'approved' } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
        { $group: { 
          _id: '$category', 
          name: { $first: '$categoryInfo.name' },
          count: { $sum: 1 },
          totalSales: { $sum: '$salesCount' }
        }},
        { $sort: { totalSales: -1 } },
        { $limit: 5 }
      ]),
      Order.find({ status: 'paid' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('customer', 'name')
        .populate('items.product', 'name price')
    ]);
    
    ok(res, {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        newUsersThisPeriod,
        ordersThisPeriod
      },
      topCategories,
      recentActivity,
      period
    });
  } catch (e) { next(e); }
};

// src/routes/statsRoutes.js
import { Router } from 'express';
import { platformStats } from '../controllers/statsController.js';
import { simpleCache } from '../middleware/cache.js';

const router = Router();

router.get('/platform', simpleCache(2 * 60 * 1000), platformStats); // Cache for 2 minutes

export default router;

// Complete package.json with all dependencies
{
  "name": "ecom-affiliate-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/seed/seed.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "@paypal/checkout-server-sdk": "^1.0.3",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.1",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.8",
    "nodemon": "^3.1.10",
    "stripe": "^16.0.0",
    "uuid": "^9.0.1"
  },
  "keywords": ["ecommerce", "affiliate", "nodejs", "express", "mongodb"],
  "author": "Your Name",
  "license": "MIT"
}

// Complete updated server.js with all routes and middleware
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimiter.js';
import { sanitizeInput, addSecurityHeaders } from './middleware/security.js';

// Import all routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import influencerRoutes from './routes/influencerRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(addSecurityHeaders);
app.use(sanitizeInput);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// Basic middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'], 
  credentials: true 
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Health checks
app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'E-commerce & Affiliate Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    node_version: process.version
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'E-commerce & Affiliate Platform API',
    version: '1.0.0',
    documentation: 'https://docs.yoursite.com',
    endpoints: {
      auth: {
        path: '/api/auth',
        methods: ['POST /register', 'POST /login', 'GET /me']
      },
      products: {
        path: '/api/products',
        methods: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id', 'GET /featured', 'GET /:id/related']
      },
      orders: {
        path: '/api/orders',
        methods: ['POST /', 'POST /paid', 'GET /mine']
      },
      affiliates: {
        path: '/api/affiliates', 
        methods: ['POST /links', 'GET /links/mine', 'GET /track/:code']
      },
      vendors: {
        path: '/api/vendors',
        methods: ['GET /dashboard', 'GET /products', 'GET /orders', 'POST /withdrawals']
      },
      influencers: {
        path: '/api/influencers',
        methods: ['POST /campaigns', 'GET /campaigns/mine', 'PUT /campaigns/:id', 'DELETE /campaigns/:id']
      },
      search: {
        path: '/api/search',
        methods: ['GET /products', 'GET /filters']
      },
      cart: {
        path: '/api/cart',
        methods: ['GET /', 'POST /add', 'PUT /update', 'DELETE /:productId', 'DELETE /']
      },
      reviews: {
        path: '/api/reviews',
        methods: ['POST /', 'GET /product/:productId']
      },
      wishlist: {
        path: '/api/wishlist',
        methods: ['GET /', 'POST /', 'DELETE /:productId']
      },
      wallet: {
        path: '/api/wallet',
        methods: ['GET /balance', 'GET /transactions', 'GET /withdrawals']
      },
      analytics: {
        path: '/api/analytics',
        methods: ['GET /vendor', 'GET /affiliate']
      },
      settings: {
        path: '/api/settings',
        methods: ['GET /profile', 'PUT /profile', 'PUT /password']
      },
      admin: {
        path: '/api/admin',
        methods: ['GET /stats', 'GET /users', 'PUT /users/:id', 'PUT /products/:id/approve', 'PUT /withdrawals/:id/process']
      }
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server gracefully...');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API documentation: http://localhost:${PORT}/api`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(e => {
  console.error('❌ DB connection failed', e);
  process.exit(1);
});

// Enhanced seed file with more comprehensive data
// src/seed/enhancedSeed.js
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import AffiliateLink from '../models/AffiliateLink.js';
import Campaign from '../models/Campaign.js';

dotenv.config();

async function run() {
  await connectDB(process.env.MONGO_URI);
  console.log('🌱 Starting enhanced seed...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    AffiliateLink.deleteMany({}),
    Campaign.deleteMany({})
  ]);

  // Create categories
  const categories = await Category.create([
    { name: 'Electronics', description: 'Tech gadgets and devices' },
    { name: 'Clothing', description: 'Fashion and apparel' },
    { name: 'Home & Garden', description: 'Home improvement and gardening' },
    { name: 'Sports', description: 'Sports and outdoor equipment' },
    { name: 'Books', description: 'Books and educational materials' }
  ]);

  // Create users
  const admin = await User.create({
    name: 'Platform Admin',
    email: 'admin@platform.com',
    password: 'admin123',
    role: 'admin',
    verified: true
  });

  const vendor1 = await User.create({
    name: 'TechStore Inc',
    email: 'vendor1@example.com',
    password: 'password123',
    role: 'vendor',
    verified: true,
    profile: {
      bio: 'Leading technology retailer',
      phone: '+1234567890'
    }
  });

  const vendor2 = await User.create({
    name: 'Fashion Hub',
    email: 'vendor2@example.com', 
    password: 'password123',
    role: 'vendor',
    verified: true,
    profile: {
      bio: 'Trendy fashion and accessories'
    }
  });

  const affiliate = await User.create({
    name: 'Marketing Pro',
    email: 'affiliate@example.com',
    password: 'password123',
    role: 'affiliate',
    verified: true,
    walletBalance: 150.50
  });

  const influencer = await User.create({
    name: 'Social Star',
    email: 'influencer@example.com',
    password: 'password123', 
    role: 'influencer',
    verified: true,
    profile: {
      bio: 'Content creator with 100k followers',
      socialLinks: {
        instagram: '@socialstar',
        youtube: 'SocialStar Channel'
      }
    }
  });

  const customer = await User.create({
    name: 'John Customer',
    email: 'customer@example.com',
    password: 'password123',
    role: 'customer',
    profile: {
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    }
  });

  // Create products
  const products = await Product.create([
    {
      vendor: vendor1._id,
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
      price: 199.99,
      comparePrice: 249.99,
      category: categories[0]._id, // Electronics
      stock_quantity: 50,
      commission_rate: 0.15,
      sku: 'WBH-001',
      tags: ['bluetooth', 'wireless', 'headphones', 'music'],
      specifications: {
        battery: '30 hours',
        connectivity: 'Bluetooth 5.0',
        weight: '250g',
        color: 'Black'
      },
      status: 'approved',
      featured: true,
      weight: 0.25,
      dimensions: { length: 20, width: 18, height: 8 }
    },
    {
      vendor: vendor1._id,
      name: 'Smart Watch Pro',
      description: 'Advanced smartwatch with health monitoring, GPS, and 7-day battery.',
      price: 299.99,
      category: categories[0]._id,
      stock_quantity: 30,
      commission_rate: 0.12,
      sku: 'SWP-001',
      tags: ['smartwatch', 'fitness', 'health', 'gps'],
      specifications: {
        display: '1.4 inch AMOLED',
        battery: '7 days',
        waterproof: 'IP68',
        sensors: 'Heart rate, GPS, Accelerometer'
      },
      status: 'approved',
      weight: 0.05
    },
    {
      vendor: vendor2._id,
      name: 'Premium Cotton T-Shirt',
      description: 'Soft, breathable cotton t-shirt perfect for casual wear.',
      price: 29.99,
      category: categories[1]._id, // Clothing
      stock_quantity: 100,
      commission_rate: 0.20,
      sku: 'PCT-001',
      tags: ['clothing', 'cotton', 'casual', 'comfortable'],
      specifications: {
        material: '100% Organic Cotton',
        fit: 'Regular',
        care: 'Machine washable'
      },
      status: 'approved',
      variants: [
        { name: 'Size', options: ['S', 'M', 'L', 'XL'], stockQuantity: 25 },
        { name: 'Color', options: ['White', 'Black', 'Navy', 'Gray'], stockQuantity: 25 }
      ],
      weight: 0.2
    },
    {
      vendor: vendor2._id,
      name: 'Designer Backpack',
      description: 'Stylish and functional backpack for work and travel.',
      price: 89.99,
      comparePrice: 120.00,
      category: categories[1]._id,
      stock_quantity: 25,
      commission_rate: 0.18,
      sku: 'DBP-001',
      tags: ['backpack', 'travel', 'work', 'designer'],
      specifications: {
        capacity: '25L',
        material: 'Waterproof Canvas',
        compartments: 'Multiple pockets',
        laptop: 'Fits 15-inch laptop'
      },
      status: 'approved',
      featured: true,
      weight: 0.8
    },
    {
      vendor: vendor1._id,
      name: 'Gaming Mechanical Keyboard',
      description: 'RGB mechanical keyboard with blue switches, perfect for gaming.',
      price: 149.99,
      category: categories[0]._id,
      stock_quantity: 40,
      commission_rate: 0.10,
      sku: 'GMK-001',
      tags: ['gaming', 'keyboard', 'mechanical', 'rgb'],
      specifications: {
        switches: 'Cherry MX Blue',
        backlight: 'RGB',
        connectivity: 'USB-C',
        layout: 'Full-size'
      },
      status: 'pending', // Some products pending approval
      weight: 1.2
    }
  ]);

  // Create affiliate links
  await AffiliateLink.create([
    {
      affiliate: affiliate._id,
      product: products[0]._id,
      clicks: 45,
      conversions: 3
    },
    {
      affiliate: affiliate._id,
      product: products[1]._id,
      clicks: 28,
      conversions: 1
    }
  ]);

  // Create influencer campaign
  await Campaign.create({
    title: 'Summer Tech Promotion',
    description: 'Promote latest tech gadgets for summer season',
    influencer: influencer._id,
    vendor: vendor1._id,
    products: [products[0]._id, products[1]._id],
    budget: 5000,
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    socialPlatforms: ['instagram', 'youtube'],
    targetAudience: {
      ageRange: { min: 18, max: 35 },
      gender: 'all',
      interests: ['technology', 'gadgets', 'lifestyle'],
      location: ['US', 'CA', 'UK']
    },
    metrics: {
      impressions: 12500,
      clicks: 340,
      conversions: 15,
      revenue: 2999.85
    }
  });

  console.log('✅ Enhanced seed completed successfully!');
  console.log('\n📊 Sample Data Created:');
  console.log(`👥 Users: ${await User.countDocuments()}`);
  console.log(`📦 Products: ${await Product.countDocuments()}`);
  console.log(`🏷️ Categories: ${await Category.countDocuments()}`);
  console.log(`🔗 Affiliate Links: ${await AffiliateLink.countDocuments()}`);
  console.log(`📢 Campaigns: ${await Campaign.countDocuments()}`);
  
  console.log('\n🔐 Test Credentials:');
  console.log('Admin: admin@platform.com / admin123');
  console.log('Vendor: vendor1@example.com / password123');
  console.log('Affiliate: affiliate@example.com / password123');
  console.log('Influencer: influencer@example.com / password123');
  console.log('Customer: customer@example.com / password123');
  
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

// Updated package.json scripts
{
  "name": "ecom-affiliate-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/seed/seed.js",
    "seed:enhanced": "node src/seed/enhancedSeed.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "lint": "echo \"Linting not configured\"",
    "build": "echo \"No build step required for Node.js\"",
    "clean": "rm -rf uploads/* && rm -rf logs/*"
  },
  "dependencies": {
    "@paypal/checkout-server-sdk": "^1.0.3",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.1",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.8",
    "nodemon": "^3.1.10",
    "stripe": "^16.0.0",
    "uuid": "^9.0.1"
  },
  "keywords": [
    "ecommerce", 
    "affiliate", 
    "marketplace", 
    "influencer", 
    "nodejs", 
    "express", 
    "mongodb"
  ],
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}

// Updated README.md with comprehensive documentation
# E-commerce & Affiliate Platform Backend

A complete Node.js backend API for an e-commerce platform with affiliate marketing, influencer campaigns, and multi-vendor support. Built with Express.js and MongoDB.

## 🚀 Features

### Core Features
- ✅ Multi-vendor marketplace
- ✅ Affiliate marketing system with tracking
- ✅ Influencer campaign management
- ✅ Product catalog with categories
- ✅ Order management with payment processing
- ✅ User authentication & role-based access
- ✅ Shopping cart & wishlist
- ✅ Product reviews & ratings
- ✅ Advanced search & filtering
- ✅ Wallet system with withdrawals
- ✅ Real-time notifications
- ✅ Analytics & reporting
- ✅ File upload handling

### User Roles
- **Customer**: Browse, purchase, review products
- **Vendor**: Manage products, view sales, withdraw earnings
- **Affiliate**: Create tracking links, earn commissions
- **Influencer**: Run marketing campaigns, collaborate with vendors
- **Admin**: Platform management, user oversight, approvals

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

## 🛠️ Installation

1. **Clone & Install**
```bash
git clone <repository-url>
cd ecom-affiliate-backend
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Make sure MongoDB is running
npm run seed:enhanced  # Load sample data
```

4. **Start Development**
```bash
npm run dev
```

## 🔧 Configuration

### Required Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/ecommerce_db

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Frontend
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:4000

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@yourplatform.com
```

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication
All protected routes require Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login  
- `GET /auth/me` - Get current user

#### Products
- `GET /products` - List products (public)
- `GET /products/:id` - Get product details
- `POST /products` - Create product (vendor)
- `PUT /products/:id` - Update product (vendor)
- `DELETE /products/:id` - Delete product (vendor)
- `GET /products/featured` - Get featured products
- `GET /products/:id/related` - Get related products

#### Orders
- `POST /orders` - Create order
- `POST /orders/paid` - Mark order as paid
- `GET /orders/mine` - Get user's orders

#### Affiliates
- `POST /affiliates/links` - Create affiliate link
- `GET /affiliates/links/mine` - Get my affiliate links
- `GET /affiliates/track/:code` - Track affiliate click

#### Search & Filters
- `GET /search/products` - Advanced product search
- `GET /search/filters` - Get available filters

#### Cart & Wishlist
- `GET /cart` - Get cart items
- `POST /cart/add` - Add to cart
- `PUT /cart/update` - Update cart item
- `DELETE /cart/:productId` - Remove from cart
- `GET /wishlist` - Get wishlist
- `POST /wishlist` - Add to wishlist

#### Analytics
- `GET /analytics/vendor` - Vendor analytics
- `GET /analytics/affiliate` - Affiliate analytics

#### Admin
- `GET /admin/stats` - Platform statistics
- `GET /admin/users` - Manage users
- `PUT /admin/products/:id/approve` - Approve/reject products
- `PUT /admin/withdrawals/:id/process` - Process withdrawals

## 🏗️ Project Structure

```
src/
├── config/
│   └── db.js                 # Database connection
├── controllers/              # Route handlers
│   ├── adminController.js
│   ├── affiliateController.js
│   ├── analyticsController.js
│   ├── authController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── influencerController.js
│   ├── notificationController.js
│   ├── orderController.js
│   ├── productController.js
│   ├── reviewController.js
│   ├── searchController.js
│   ├── settingsController.js
│   ├── statsController.js
│   ├── vendorController.js
│   ├── walletController.js
│   └── wishlistController.js
├── middleware/               # Custom middleware
│   ├── auth.js              # JWT authentication
│   ├── cache.js             # Simple caching
│   ├── errorHandler.js      # Error handling
│   ├── rateLimiter.js       # Rate limiting
│   ├── roles.js             # Role-based access
│   ├── security.js          # Security headers
│   ├── upload.js            # File upload
│   ├── validate.js          # Input validation
│   └── validation.js        # Validation schemas
├── models/                  # Mongoose models
│   ├── AffiliateLink.js
│   ├── Campaign.js
│   ├── Category.js
│   ├── Notification.js
│   ├── Order.js
│   ├── Product.js
│   ├── Review.js
│   ├── Transaction.js
│   ├── User.js
│   └── Withdrawal.js
├── routes/                  # Route definitions
│   ├── adminRoutes.js
│   ├── affiliateRoutes.js
│   ├── analyticsRoutes.js
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   ├── categoryRoutes.js
│   ├── influencerRoutes.js
│   ├── notificationRoutes.js
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   ├── reviewRoutes.js
│   ├── searchRoutes.js
│   ├── settingsRoutes.js
│   ├── statsRoutes.js
│   ├── uploadRoutes.js
│   ├── vendorRoutes.js
│   ├── walletRoutes.js
│   └── wishlistRoutes.js
├── services/                # Business logic
│   ├── email.js             # Email service
│   ├── inventory.js         # Stock management
│   ├── notifications.js     # Notification service
│   └── payments/            # Payment providers
│       ├── paypal.js
│       └── stripe.js
├── utils/                   # Utility functions
│   ├── analytics.js         # Analytics calculations
│   ├── helpers.js           # General helpers
│   ├── pagination.js        # Pagination utility
│   └── response.js          # Response formatting
├── seed/                    # Database seeding
│   ├── seed.js              # Basic seed
│   └── enhancedSeed.js      # Comprehensive seed
└── server.js                # Application entry point
```

## 🔄 User Flows

### Vendor Flow
1. Register as vendor → Profile setup
2. Upload products → Admin approval
3. Monitor sales → View analytics
4. Request withdrawals → Receive payments

### Affiliate Flow  
1. Register as affiliate → Browse products
2. Create affiliate links → Share links
3. Track clicks/conversions → Earn commissions
4. Request withdrawals → Get paid

### Influencer Flow
1. Register as influencer → Create campaigns
2. Connect with vendors → Select products
3. Run promotions → Track performance
4. Analyze results → Optimize campaigns

### Customer Flow
1. Browse marketplace → Add to cart/wishlist
2. Checkout with payment → Receive order
3. Leave reviews → Build reputation

## 💳 Payment Integration

### Stripe
```javascript
// Automatic payment intent creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: orderTotal * 100, // cents
  currency: 'usd',
  metadata: { orderId: order._id }
});
```

### PayPal
```javascript
// PayPal order creation
const paypalOrder = await paypal.orders.create({
  intent: 'CAPTURE',
  purchase_units: [{ amount: { value: orderTotal } }]
});
```

## 📈 Commission System

The platform uses a three-way split:
- **Affiliate**: 10-20% commission (configurable per product)
- **Platform**: 5% platform fee
- **Vendor**: Remaining amount (75-85%)

```javascript
const breakdown = {
  subtotal: 100.00,
  affiliateCommission: 15.00,  // 15%
  platformFee: 5.00,           // 5%
  vendorPayout: 80.00          // 80%
};
```

## 🔍 Search & Filtering

Advanced search supports:
- Text search across name, description, tags
- Category filtering
- Price range filtering  
- Sorting by price, date, rating, popularity
- Pagination with metadata

## 📊 Analytics Features

### Vendor Analytics
- Sales overview and trends
- Top-performing products
- Revenue breakdowns
- Order analytics

### Affiliate Analytics  
- Click-through rates
- Conversion tracking
- Commission earnings
- Link performance

### Platform Analytics
- User growth metrics
- Revenue reporting
- Popular categories
- System health

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting (1000 req/15min)
- Input sanitization
- Security headers
- Password hashing with bcrypt
- File upload validation

## 🚀 Deployment

### Production Setup
1. Set NODE_ENV=production
2. Use production MongoDB URI
3. Configure production payment keys
4. Set up SSL certificates
5. Configure email service
6. Set up monitoring

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 4000
CMD ["npm", "start"]
```

## 🧪 Testing

### Sample API Calls

#### Register User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "password123",
    "role": "vendor"
  }'
```

#### Create Product
```bash
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "price": 99.99,
    "stock_quantity": 10
  }'
```

#### Search Products
```bash
curl "http://localhost:4000/api/search/products?q=headphones&minPrice=50&maxPrice=300&page=1&limit=10"
```

## 📝 API Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## 🔧 Maintenance

### Database Indexes
The following indexes are automatically created:
- User: email (unique)
- Product: text search, category+price, vendor+status
- AffiliateLink: code (unique)
- Order: customer, status, createdAt

### Monitoring Endpoints
- `GET /health` - Health check
- `GET /api/stats/platform` - Platform statistics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check MongoDB is running
- Verify MONGO_URI in .env

**JWT Errors**
- Ensure JWT_SECRET is set
- Check token expiration

**File Upload Issues**
- Verify uploads/ directory exists
- Check file permissions

**Payment Integration**
- Confirm API keys are correct
- Check webhook endpoints

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoint guide

---

This backend provides a complete foundation for an e-commerce platform with affiliate marketing capabilities. All major features from the PDF specifications have been implemented with room for customization and extension.