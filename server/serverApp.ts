import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed/seedData.js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import express from 'express';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

export async function startServer() {
  await connectDB();
  await seedDatabase();

  const app = createApp();

  if (!isProd) {
    // Mount Vite dev server middlewares in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏛️ GovTrack server running on http://0.0.0.0:${PORT}`);
  });
}
