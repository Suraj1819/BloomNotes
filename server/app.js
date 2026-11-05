// server/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './src/config/env.js';
import { globalLimiter } from './src/middleware/rateLimit.js';
import { notFound, errorHandler } from './src/middleware/error.js';
import { logger } from './src/utils/logger.js';
import router from './src/routes/index.js';

const app = express();

// Trust proxy (Render / Vercel-style hosting behind a reverse proxy).
app.set('trust proxy', 1);

// Security headers. relax frameguard/asset-serving for dev tools if needed.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — explicit allowed origin.
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Background',
  ],
}));

app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Request logging — structured via morgan + custom stream.
app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: { write: (m) => logger.info(m.trim()) } }));

// Vault uploads stream raw body — bypass JSON body parser for that path.
app.use('/api/v1/vault/upload', (req, _res, next) => {
  // For multipart uploads we want the raw stream; skip express.json parsing.
  // express.json already ran, so we re-collect via the controller.
  next();
});

// Global rate limiter.
app.use('/api', globalLimiter);

// API routes.
app.use('/api/v1', router);

// Health root.
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// 404 + error handlers (last).
app.use(notFound);
app.use(errorHandler);

export default app;
