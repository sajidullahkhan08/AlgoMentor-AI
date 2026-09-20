/**
 * Tutor Engine API routes.
 *
 * Endpoints:
 * - POST /api/tutor/session — Start or resume a tutoring session
 * - GET  /api/tutor/session/:id — Get session status and interaction history
 * - POST /api/tutor/session/:id/respond — Submit student response and get evaluation
 * - POST /api/tutor/session/:id/hint — Request hint on current interaction
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { tutorEngine } from '../services/tutorEngine';

const router = Router();

// Validation schemas
const startSessionSchema = z.object({
  conceptId: z.string().uuid('Invalid concept ID'),
});

const submitResponseSchema = z.object({
  interactionId: z.string().uuid('Invalid interaction ID'),
  answer: z.string().min(1, 'Answer cannot be empty'),
  confidence: z
    .enum(['confident', 'somewhat_confident', 'unsure', 'dont_know'])
    .optional(),
});

const requestHintSchema = z.object({
  interactionId: z.string().uuid('Invalid interaction ID'),
});

/**
 * POST /api/tutor/session
 * Start a new tutoring session or resume an active one for a concept.
 */
router.post('/session', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = startSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const userId = req.userId!;
    const result = await tutorEngine.startOrResumeSession(userId, parsed.data.conceptId);
    res.json(result);
  } catch (err: any) {
    console.error('[TutorRoute] Error starting session:', err);
    res.status(500).json({ error: err.message || 'Failed to start session' });
  }
});

/**
 * GET /api/tutor/session/:id
 * Retrieve session details, interactions, and knowledge state.
 */
router.get('/session/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const result = await tutorEngine.getSessionDetails(userId, sessionId);
    res.json(result);
  } catch (err: any) {
    console.error('[TutorRoute] Error getting session:', err);
    res.status(500).json({ error: err.message || 'Failed to get session' });
  }
});

/**
 * POST /api/tutor/session/:id/respond
 * Submit an answer to an interaction.
 */
router.post(
  '/session/:id/respond',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = submitResponseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const userId = req.userId!;
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
      const { interactionId, answer, confidence } = parsed.data;

      const result = await tutorEngine.submitResponse(userId, sessionId, interactionId, {
        answer,
        confidence,
      });

      res.json(result);
    } catch (err: any) {
      console.error('[TutorRoute] Error submitting response:', err);
      res.status(500).json({ error: err.message || 'Failed to submit response' });
    }
  }
);

/**
 * POST /api/tutor/session/:id/hint
 * Request the next hint on the hint ladder for an interaction.
 */
router.post(
  '/session/:id/hint',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = requestHintSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const userId = req.userId!;
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
      const { interactionId } = parsed.data;

      const hint = await tutorEngine.requestHint(userId, sessionId, interactionId);
      res.json(hint);
    } catch (err: any) {
      console.error('[TutorRoute] Error generating hint:', err);
      res.status(500).json({ error: err.message || 'Failed to generate hint' });
    }
  }
);

export default router;
