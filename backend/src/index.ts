import dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

import { env } from './config/env';

// Validate environment on startup
env.validate();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { aiLimiter, globalApiLimiter } from './middleware/rateLimit';
import { courseRoutes } from './routes/courses';
import { conceptRoutes } from './routes/concepts';
import { profileRoutes } from './routes/profiles';
import { healthRoutes } from './routes/health';
import tutorRoutes from './routes/tutor';
import problemRoutes from './routes/problems';
import revisionRoutes from './routes/revision';
import systemDesignRoutes from './routes/systemDesign';
import { progressRoutes } from './routes/progress';
import { authenticate } from './middleware/authenticate';

const app = express();

// Opt-in only: trusting forwarded headers when the app is directly exposed
// would let clients spoof their IP for rate limiting.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn(
    '[AlgoMentor] CORS_ORIGINS is not set. Browser clients from non-allowlisted origins will be blocked.'
  );
}

// --- Security headers ---
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=()');
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// --- Middleware ---
app.use(
  cors({
    origin(origin, callback) {
      // Native apps and server-to-server calls send no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.length > 0) {
        return callback(null, allowedOrigins.includes(origin));
      }
      // Development defaults to permissive; production requires CORS_ORIGINS.
      return callback(null, env.NODE_ENV !== 'production');
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400,
  })
);
app.use(globalApiLimiter);
app.use(express.json({ limit: '128kb', strict: true }));

// --- Routes ---
app.use('/api', healthRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/tutor', authenticate, tutorRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/revision', authenticate, revisionRoutes);
app.use('/api/system-design/evaluate', authenticate, aiLimiter);
app.use('/api/system-design', systemDesignRoutes);
app.use('/api/progress', progressRoutes);

// --- Error handling (must be last) ---
app.use(errorHandler);

// --- Start server ---
const PORT = env.PORT;
const HOST = '0.0.0.0'; // Bind to all interfaces so physical devices on the LAN can connect
app.listen(PORT, HOST, () => {
  console.log(`[AlgoMentor] Backend running on http://${HOST}:${PORT}`);
  console.log(`[AlgoMentor] Environment: ${env.NODE_ENV}`);
  console.log(`[AlgoMentor] For Expo Go on a physical device, use your computer's LAN IP (e.g. http://192.168.x.x:${PORT}/api)`);
});

export default app;
