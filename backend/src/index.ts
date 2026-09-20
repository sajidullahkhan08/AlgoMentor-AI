import dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

import { env } from './config/env';

// Validate environment on startup
env.validate();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { courseRoutes } from './routes/courses';
import { conceptRoutes } from './routes/concepts';
import { profileRoutes } from './routes/profiles';
import { healthRoutes } from './routes/health';
import tutorRoutes from './routes/tutor';
import { authenticate } from './middleware/authenticate';

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api', healthRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/tutor', authenticate, tutorRoutes);

// --- Error handling (must be last) ---
app.use(errorHandler);

// --- Start server ---
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`[AlgoMentor] Backend running on http://localhost:${PORT}`);
  console.log(`[AlgoMentor] Environment: ${env.NODE_ENV}`);
});

export default app;
