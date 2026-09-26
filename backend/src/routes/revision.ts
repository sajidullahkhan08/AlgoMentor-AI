/**
 * Revision & Spaced Repetition Routes (Phase 8).
 *
 * Implements endpoints for retrieval practice queue, reviewing items
 * with SM-2 spaced repetition calculation, and stats reporting.
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { revisionService } from '../services/revisionService';

const router = Router();

const reviewItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  rating: z.number().int().min(0).max(5),
  confidence: z.string().optional(),
  timeSpentSeconds: z.number().int().nonnegative().optional(),
});

/**
 * GET /api/revision/queue
 * Retrieve items due for spaced revision.
 */
router.get('/queue', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'guest-user';
    const queue = await revisionService.getDueQueue(userId);
    res.json(queue);
  } catch (err: any) {
    console.error('[RevisionRoutes] Error fetching queue:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch revision queue' });
  }
});

/**
 * POST /api/revision/review
 * Submit an SM-2 rating for an item.
 */
router.post('/review', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = reviewItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const userId = req.userId || 'guest-user';
    const { itemId, rating, confidence, timeSpentSeconds } = parsed.data;

    const result = await revisionService.reviewItem(
      userId,
      itemId,
      rating,
      confidence,
      timeSpentSeconds || 0
    );

    res.json(result);
  } catch (err: any) {
    console.error('[RevisionRoutes] Error submitting review:', err);
    res.status(500).json({ error: err.message || 'Failed to submit review' });
  }
});

/**
 * GET /api/revision/stats
 * Retrieve user's retention rates and Leitner box distributions.
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'guest-user';
    const stats = await revisionService.getStats(userId);
    res.json(stats);
  } catch (err: any) {
    console.error('[RevisionRoutes] Error fetching stats:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch revision stats' });
  }
});

export default router;
