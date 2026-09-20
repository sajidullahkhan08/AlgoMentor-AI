/**
 * Health check route.
 */

import { Router, Request, Response } from 'express';

export const healthRoutes = Router();

healthRoutes.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'algomentor-backend',
    timestamp: new Date().toISOString(),
  });
});
