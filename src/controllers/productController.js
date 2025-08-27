import Product from '../models/Product.js';
import { paginate } from '../utils/pagination.js';
import { ok } from '../utils/response.js';

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
    const { page = 1, limit = 20, q, mine } = req.query;

    let query = Product.find();
    if (mine) {
      query = query.find({ vendor: req.user.id });
    }
    if (q) {
      query = query.find({ $text: { $search: q } });
    }

    const items = await paginate(
      query.populate('vendor', 'name'),
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
    const body = { ...req.body, vendor: req.user.id };
    const product = await Product.create(body);
    ok(res, normalize(product), 'Product created');
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
    if (!product)
      return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(product, req.body);
    await product.save();
    ok(res, normalize(product), 'Updated');
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
    if (!product)
      return res.status(404).json({ success: false, message: 'Not found' });
    ok(res, normalize(product), 'Deleted');
  } catch (e) {
    next(e);
  }
};

export const get = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'vendor',
      'name'
    );
    if (!product || !product.active)
      return res.status(404).json({ success: false, message: 'Not found' });
    ok(res, normalize(product));
  } catch (e) {
    next(e);
  }
};
