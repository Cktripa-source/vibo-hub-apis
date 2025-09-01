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