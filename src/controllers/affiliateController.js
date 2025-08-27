import AffiliateLink from '../models/AffiliateLink.js';
import Product from '../models/Product.js';
import { ok } from '../utils/response.js';

export const createLink = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const link = await AffiliateLink.create({ product: productId, affiliate: req.user.id });
    ok(res, link, 'Affiliate link created');
  } catch (e) { next(e); }
};

export const myLinks = async (req, res, next) => {
  try {
    const links = await AffiliateLink.find({ affiliate: req.user.id }).populate('product','title price');
    ok(res, links);
  } catch (e) { next(e); }
};

export const trackClick = async (req, res, next) => {
  try {
    const { code } = req.params;
    const link = await AffiliateLink.findOne({ code }).populate('product');
    if (!link) return res.status(404).json({ success: false, message: 'Invalid code' });
    link.clicks += 1; await link.save();
    res.redirect(`${process.env.BASE_URL.replace(/\/$/, '')}/api/products/${link.product._id}?affiliate=${code}`);
  } catch (e) { next(e); }
};
