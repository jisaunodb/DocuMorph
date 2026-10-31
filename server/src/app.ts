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

// Vercel Serverless URL Normalization Middleware:
// When Vercel rewrites /api/(.*) to /api, it supplies the original route in x-matched-path.
// Restoring req.url ensures Express routing matches accurately across both local & Vercel serverless.
app.use((req, res, next) => {
  const matchedPath = (req.headers['x-matched-path'] as string) || (req.headers['x-now-route-matches'] as string);
  if (matchedPath && typeof matchedPath === 'string') {
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
    req.url = matchedPath + queryString;
  }
  next();
});

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
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'DocuMorph SaaS API',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Node Server',
    storageMode: config.mongoUri ? 'MongoDB Atlas' : 'Resilient Storage Engine',
    version: '1.0.0',
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// REST API Routes (supports both /api/ prefix and direct routes for serverless resilience)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/tools', toolRoutes);
app.use('/tools', toolRoutes);

app.use('/api/files', fileRoutes);
app.use('/files', fileRoutes);

app.use('/api/conversions', conversionRoutes);
app.use('/conversions', conversionRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/payment', paymentRoutes);
app.use('/payment', paymentRoutes);

// Global JSON error handler to guarantee the client always receives valid JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    code: err.code || 'SERVER_ERROR',
  });
});

export default app;
