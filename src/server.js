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
const cors = require("cors");

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin || true); // allow all origins
    },
    credentials: true,
  })
);

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