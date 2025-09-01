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