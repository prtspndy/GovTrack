import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/authRoutes.js';
import documentTypeRoutes from './routes/documentTypeRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Basic security & CORS
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'GovTrack — Government Document Request & Status Tracking System',
      time: new Date().toISOString()
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/document-types', documentTypeRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/public', publicRoutes);

  // Global error handler
  app.use(errorHandler);

  return app;
}
