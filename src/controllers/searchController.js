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