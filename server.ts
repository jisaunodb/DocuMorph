import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { config } from './server/src/config/env';
import { connectDB } from './server/src/config/db';
import authRoutes from './server/src/routes/authRoutes';
import toolRoutes from './server/src/routes/toolRoutes';
import fileRoutes from './server/src/routes/fileRoutes';
import conversionRoutes from './server/src/routes/conversionRoutes';
import adminRoutes from './server/src/routes/adminRoutes';
import seoRoutes from './server/src/routes/seoRoutes';
import paymentRoutes from './server/src/routes/paymentRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Basic CORS headers for multi-origin requests
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Connect to Database asynchronously without blocking server listening
  connectDB().catch((err) => {
    console.warn('[Database] Database connection attempt error:', err);
  });

  // Root SEO routes
  app.use('/', seoRoutes);

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DocuMorph SaaS API',
      timestamp: new Date().toISOString(),
      storageMode: config.mongoUri ? 'MongoDB Atlas' : 'Local Storage Engine',
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

  // Serve static files from uploads folder if needed
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Vite middleware in dev / Static dist in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DocuMorph] Server successfully running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DocuMorph] Failed to start server:', err);
});
