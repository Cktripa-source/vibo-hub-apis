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