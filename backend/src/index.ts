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
import problemRoutes from './routes/problems';
import revisionRoutes from './routes/revision';
import systemDesignRoutes from './routes/systemDesign';
import { authenticate, optionalAuthenticate } from './middleware/authenticate';

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api', healthRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/tutor', optionalAuthenticate, tutorRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/revision', optionalAuthenticate, revisionRoutes);
app.use('/api/system-design', systemDesignRoutes);

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
