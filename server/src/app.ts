import express from 'express';
import path from 'path';
import { config } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import toolRoutes from './routes/toolRoutes';
import fileRoutes from './routes/fileRoutes';
import conversionRoutes from './routes/conversionRoutes';
import adminRoutes from './routes/adminRoutes';
import seoRoutes from './routes/seoRoutes';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Asynchronously connect to MongoDB without blocking API initialization
connectDB().catch((err) => {
  console.warn('[Database] Database connection attempt warning:', err.message);
});

// Root SEO routes (sitemap.xml, robots.txt)
app.use('/', seoRoutes);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DocuMorph SaaS API',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Node Server',
    storageMode: config.mongoUri ? 'MongoDB Atlas' : 'Resilient Storage Engine',
    version: '1.0.0',
  });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/conversions', conversionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// Serve uploads statically if local folder exists
try {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
} catch {
  // Silent in serverless environments
}

export default app;
