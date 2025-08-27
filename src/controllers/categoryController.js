import Category from '../models/Category.js';
import { ok } from '../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort('name');
    ok(res, { categories });
  } catch (e) {
    next(e);
  }
};

export const create = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    ok(res, category, 'Category created');
  } catch (e) {
    next(e);
  }
};
