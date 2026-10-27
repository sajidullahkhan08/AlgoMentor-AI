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
import { aiLimiter, practiceLimiter } from '../middleware/rateLimit';
import { tutorEngine } from '../services/tutorEngine';

const router = Router();

// Validation schemas
const startSessionSchema = z.object({
  conceptId: z.string().uuid('Invalid concept ID'),
});

const submitResponseSchema = z.object({
  interactionId: z.string().uuid('Invalid interaction ID'),
  answer: z.string().min(1, 'Answer cannot be empty').max(4_000, 'Answer is too long'),
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
router.post(
  '/session',
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = startSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const result = await tutorEngine.startOrResumeSession(req.userId!, parsed.data.conceptId);
      res.json(result);
    } catch (err: any) {
      console.error('[TutorRoute] Error starting session:', err);
      res.status(500).json({ error: 'Failed to start session' });
    }
  }
);

/**
 * GET /api/tutor/session/:id
 * Retrieve session details, interactions, and knowledge state.
 */
router.get('/session/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const result = await tutorEngine.getSessionDetails(req.userId!, sessionId);
    res.json(result);
  } catch (err: any) {
    console.error('[TutorRoute] Error getting session:', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * POST /api/tutor/session/:id/respond
 * Submit an answer to an interaction.
 */
router.post(
  '/session/:id/respond',
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = submitResponseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
      const { interactionId, answer, confidence } = parsed.data;

      const result = await tutorEngine.submitResponse(req.userId!, sessionId, interactionId, {
        answer,
        confidence,
      });

      res.json(result);
    } catch (err: any) {
      console.error('[TutorRoute] Error submitting response:', err);
      res.status(500).json({ error: 'Failed to submit response' });
    }
  }
);

/**
 * POST /api/tutor/session/:id/hint
 * Request the next hint on the hint ladder for an interaction.
 */
router.post(
  '/session/:id/hint',
  practiceLimiter,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = requestHintSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
      const { interactionId } = parsed.data;

      const hint = await tutorEngine.requestHint(req.userId!, sessionId, interactionId);
      res.json(hint);
    } catch (err: any) {
      console.error('[TutorRoute] Error generating hint:', err);
      res.status(500).json({ error: 'Failed to generate hint' });
    }
  }
);

import { getAIProvider } from '../services/ai';

const evaluateVoiceSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2_000, 'Prompt is too long'),
  transcript: z
    .string()
    .min(1, 'Transcript is required')
    .max(20_000, 'Transcript exceeds the 20,000 character limit'),
  topicOrProblem: z
    .string()
    .min(1, 'Topic or problem name is required')
    .max(200, 'Topic or problem name is too long'),
});

/**
 * POST /api/tutor/voice/evaluate
 * Evaluate student's spoken/conversational reasoning.
 */
router.post(
  '/voice/evaluate',
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = evaluateVoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { prompt, transcript, topicOrProblem } = parsed.data;
      const aiProvider = getAIProvider();
      const review = await aiProvider.evaluateSpokenReasoning(prompt, transcript, topicOrProblem);
      res.json(review);
    } catch (err: any) {
      console.error('[TutorRoute] Error evaluating voice reasoning:', err);
      res.status(500).json({ error: 'Failed to evaluate voice reasoning' });
    }
  }
);

export default router;
