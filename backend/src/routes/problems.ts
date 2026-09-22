/**
 * Problems and Patterns API Routes.
 *
 * Endpoints:
 * - GET  /api/problems         — List problems with optional filtering
 * - GET  /api/problems/patterns — List all DSA patterns
 * - GET  /api/problems/:id     — Get problem detail
 * - POST /api/problems/:id/run — Run code on sample test cases
 * - POST /api/problems/:id/submit — Submit code for full test suite and Socratic AI review
 * - POST /api/problems/:id/hint — Get graduated hint for problem
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authenticate } from '../middleware/authenticate';
import { problemsService } from '../services/problemsService';

const router = Router();

const runCodeSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
  language: z.string().default('javascript'),
});

const submitCodeSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
  language: z.string().default('javascript'),
  hintsUsed: z.number().int().min(0).default(0),
});

const hintSchema = z.object({
  hintLevel: z.number().int().min(1).max(3).default(1),
});

/**
 * GET /api/problems/patterns
 * List all DSA patterns. (Placed before /:id to avoid collision)
 */
router.get('/patterns', async (_req, res: Response): Promise<void> => {
  try {
    const patterns = await problemsService.getPatterns();
    res.json({ patterns });
  } catch (err: any) {
    console.error('[ProblemsRoute] Error fetching patterns:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch patterns' });
  }
});

/**
 * GET /api/problems
 * List all coding problems.
 */
router.get('/', async (req, res: Response): Promise<void> => {
  try {
    const difficulty = req.query.difficulty as string | undefined;
    const category = req.query.category as string | undefined;
    const patternId = req.query.patternId as string | undefined;

    const problems = await problemsService.getProblems({ difficulty, category, patternId });
    res.json({ problems });
  } catch (err: any) {
    console.error('[ProblemsRoute] Error fetching problems:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch problems' });
  }
});

/**
 * GET /api/problems/:id
 * Get single problem details.
 */
router.get('/:id', async (req, res: Response): Promise<void> => {
  try {
    const problemId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const problem = await problemsService.getProblemById(problemId);
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }
    res.json({ problem });
  } catch (err: any) {
    console.error('[ProblemsRoute] Error fetching problem:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch problem' });
  }
});

/**
 * POST /api/problems/:id/run
 * Run code against sample tests.
 */
router.post('/:id/run', async (req, res: Response): Promise<void> => {
  try {
    const problemId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const parsed = runCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { code, language } = parsed.data;
    const result = await problemsService.runCode(problemId, code, language);
    res.json(result);
  } catch (err: any) {
    console.error('[ProblemsRoute] Error running code:', err);
    res.status(500).json({ error: err.message || 'Failed to run code' });
  }
});

/**
 * POST /api/problems/:id/submit
 * Submit code for full evaluation and Socratic AI review.
 */
router.post(
  '/:id/submit',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const problemId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
      const parsed = submitCodeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const userId = req.userId!;
      const { code, language, hintsUsed } = parsed.data;
      const result = await problemsService.submitCode(userId, problemId, code, language, hintsUsed);
      res.json(result);
    } catch (err: any) {
      console.error('[ProblemsRoute] Error submitting solution:', err);
      res.status(500).json({ error: err.message || 'Failed to submit solution' });
    }
  }
);

/**
 * POST /api/problems/:id/hint
 * Request graduated Socratic hint.
 */
router.post('/:id/hint', async (req, res: Response): Promise<void> => {
  try {
    const problemId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const parsed = hintSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const hint = await problemsService.getProblemHint(problemId, parsed.data.hintLevel);
    res.json(hint);
  } catch (err: any) {
    console.error('[ProblemsRoute] Error fetching hint:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch hint' });
  }
});

export default router;
