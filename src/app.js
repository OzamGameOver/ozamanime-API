import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { rateLimiter } from 'hono-rate-limiter';
import { swaggerUI } from '@hono/swagger-ui';
import { serveStatic } from 'hono/serve-static';
import { logger } from 'hono/logger';
import fs from 'fs';
import path from 'path';

import hiAnimeRoutes from './routes/routes.js';
import { AppError } from './utils/errors.js';
import { fail } from './utils/response.js';
import hianimeApiDocs from './utils/swaggerUi.js';

// Load environment variables
config();

const app = new Hono();

// ------------------------
// 1️⃣ Load Blacklist
// ------------------------
const blacklistPath = path.join('./scr/blacklist/blacklist.json');
let blacklist = [];

try {
  const data = fs.readFileSync(blacklistPath, 'utf8');
  blacklist = JSON.parse(data).blacklist || [];
  console.log('Blacklist loaded:', blacklist);
} catch (err) {
  console.error('Failed to load blacklist:', err);
}

// ------------------------
// 2️⃣ Blacklist Middleware
// ------------------------
app.use('/watch/:anime', async (c, next) => {
  // Extract anime ID from URL
  // e.g., /watch/overflow-uncensored-17884
  const animeParam = c.req.param('anime'); // returns "overflow-uncensored-17884"
  const animeId = animeParam.split('-').pop(); // "17884"

  if (blacklist.includes(animeId)) {
    return c.text('This anime is blocked 🚫', 403);
  }

  await next();
});

// ------------------------
// Serve manual subtitles folder
// ------------------------
app.get('/manual-sub/*', serveStatic({ root: './manual-sub' }));

// ------------------------
// CORS setup
// ------------------------
const origins = process.env.ORIGIN ? process.env.ORIGIN.split(',') : '*';
app.use(
  '*',
  cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: '*',
  })
);

// ------------------------
// Rate limiter middleware
// ------------------------
app.use(
  rateLimiter({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000,
    limit: process.env.RATE_LIMIT_LIMIT || 20,
    standardHeaders: 'draft-6',
    keyGenerator: (c) => {
      const ip = (c.req.header('x-forwarded-for') || '').split(',')[0].trim();
      return ip;
    },
  })
);

// ------------------------
// Logger middleware
// ------------------------
app.use('/api/v1/*', logger());

// ------------------------
// Basic routes
// ------------------------
app.get('/', (c) => c.text('Welcome to Anime API 🎉 Go to /ui for docs', 200));
app.get('/ping', (c) => c.text('pong'));
app.get('/app-update', (c) =>
  c.json({
    latestVersion: '1.3.0',
    forceUpdate: false,
    title: 'New Update Available 🚀',
    message: 'Bug fixes, faster streaming, better performance',
    apkUrl:
      'https://drive.usercontent.google.com/u/0/uc?id=1LJoSWCBvTxcS9KdlZxQgiKEinKF_-EPa&export=download',
  })
);

// ------------------------
// API routes
// ------------------------
app.route('/api/v1', hiAnimeRoutes);

// ------------------------
// Swagger/OpenAPI
// ------------------------
app.get('/doc', (c) => c.json(hianimeApiDocs));
app.get('/ui', swaggerUI({ url: '/doc' }));

// ------------------------
// Global error handling
// ------------------------
app.onError((err, c) => {
  if (err instanceof AppError) {
    return fail(c, err.message, err.statusCode, err.details);
  }
  console.error('Unexpected Error: ' + err.message);
  return fail(c);
});

export default app;
