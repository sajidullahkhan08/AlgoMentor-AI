/**
 * Progress routes.
 *
 * - GET /api/progress/summary — dashboard aggregates for the signed-in learner
 * - GET /api/progress/concepts/:conceptId — per-concept mastery + prerequisites
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticate } from '../middleware/authenticate';
import { progressService } from '../services/progressService';

export const progressRoutes = Router();

progressRoutes.get('/summary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await progressService.getSummary(req.userId!);
    res.json(summary);
  } catch (err: any) {
    console.error('[ProgressRoute] Summary failed:', err);
    res.status(500).json({ error: 'Failed to load progress summary' });
  }
});

progressRoutes.get(
  '/concepts/:conceptId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conceptId = String(req.params.conceptId);
      const progress = await progressService.getConceptProgress(req.userId!, conceptId);
      res.json(progress);
    } catch (err: any) {
      if (err?.message === 'Concept not found') {
        res.status(404).json({ error: 'Concept not found' });
        return;
      }
      console.error('[ProgressRoute] Concept progress failed:', err);
      res.status(500).json({ error: 'Failed to load concept progress' });
    }
  }
);
