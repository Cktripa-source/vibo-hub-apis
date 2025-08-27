import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

dotenv.config();

async function run() {
  await connectDB(process.env.MONGO_URI);

  // Clear collections
  await User.deleteMany({});
  await Product.deleteMany({});

  // Create demo users
  const vendor = await User.create({
    name: 'Demo Vendor',
    email: 'vendor@example.com',
    password: 'password',
    role: 'vendor'
  });

  await User.create({
    name: 'Demo Affiliate',
    email: 'affiliate@example.com',
    password: 'password',
    role: 'affiliate'
  });

  await User.create({
    name: 'Demo Customer',
    email: 'customer@example.com',
    password: 'password',
    role: 'customer'
  });

  // Insert products that match schema
  await Product.create([
    {
      vendor: vendor._id,
      name: 'T-Shirt',
      description: 'Soft cotton tee',
      price: 19.99,
      images: [],
      stock_quantity: 200,
      commission_rate: 12,
      tags: ['clothing', 'apparel']
    },
    {
      vendor: vendor._id,
      name: 'Mug',
      description: 'Ceramic mug 350ml',
      price: 9.99,
      images: [],
      stock_quantity: 150,
      commission_rate: 10,
      tags: ['kitchen', 'drinkware']
    }
  ]);

  console.log('✅ Seed complete');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
