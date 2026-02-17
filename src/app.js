import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { rateLimiter } from 'hono-rate-limiter';
import { swaggerUI } from '@hono/swagger-ui';

import hiAnimeRoutes from './routes/routes.js';

import { AppError } from './utils/errors.js';
import { fail } from './utils/response.js';
import hianimeApiDocs from './utils/swaggerUi.js';
import { logger } from 'hono/logger';

const app = new Hono();

config();

const origins = process.env.ORIGIN ? process.env.ORIGIN.split(',') : '*';

// third party middlewares
app.use(
  '*',
  cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: '*',
  })
);

// Apply the rate limiting middleware to all requests.
app.use(
  rateLimiter({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000,
    limit: process.env.RATE_LIMIT_LIMIT || 20,
    standardHeaders: 'draft-6', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: (c) => {
      const ip = (c.req.header('x-forwarded-for') || '').split(',')[0].trim();
      return ip;
    },
  })
);

// middlewares
// app.use('/api/v1/*', protect);
// routes

app.use('/api/v1/*', logger());

app.get('/', (c) => {
  c.status(200);
  return c.text('welcome to anime API 🎉 goto /ui for docs');
});
app.get('/ping', (c) => {
  return c.text('pong');
});
app.get('/app-update', (c) => {
  return c.json({
    latestVersion: "1.0.1", // change this when you release a new update
    forceUpdate: false,      // true = user cannot skip
    title: "New Update Available 🚀",
    message: "Bug fixes, faster streaming, better performance",
    apkUrl: "https://drive.google.com/file/d/1LJoSWCBvTxcS9KdlZxQgiKEinKF_-EPa/view?usp=sharing"
  });
});

app.route('/api/v1', hiAnimeRoutes);
app.get('/doc', (c) => c.json(hianimeApiDocs));

// Use the middleware to serve Swagger UI at /ui
app.get('/ui', swaggerUI({ url: '/doc' }));
app.onError((err, c) => {
  if (err instanceof AppError) {
    return fail(c, err.message, err.statusCode, err.details);
  }
  console.error('unexpacted Error :' + err.message);

  return fail(c);
});

export default app;
