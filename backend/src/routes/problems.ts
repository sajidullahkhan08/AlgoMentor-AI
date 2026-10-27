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
import {
  aiLimiter,
  codeExecutionLimiter,
  practiceLimiter,
} from '../middleware/rateLimit';
import { problemsService } from '../services/problemsService';
import {
  CodeExecutionSummary,
  UnsupportedLanguageError,
} from '../services/codeRunner';

const router = Router();

const codeSchema = z
  .string()
  .trim()
  .min(1, 'Code cannot be empty')
  .max(20_000, 'Code exceeds the 20,000 character limit');

const languageSchema = z
  .string()
  .transform((value) => value.toLowerCase())
  .refine((value) => value === 'javascript' || value === 'js', {
    message: 'Only JavaScript is supported for execution',
  })
  .default('javascript');

const runCodeSchema = z.object({
  code: codeSchema,
  language: languageSchema,
});

const submitCodeSchema = z.object({
  code: codeSchema,
  language: languageSchema,
  hintsUsed: z.number().int().min(0).max(100).default(0),
});

const hintSchema = z.object({
  hintLevel: z.number().int().min(1).max(3).default(1),
});

function respondToRouteError(
  res: Response,
  context: string,
  err: any,
  publicMessage: string
): void {
  console.error(`[ProblemsRoute] ${context}:`, err);

  if (err instanceof UnsupportedLanguageError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err?.message === 'Problem not found') {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  res.status(500).json({ error: publicMessage });
}

/**
 * Expose the execution summary in both the service's canonical shape and the
 * flattened shape expected by the mobile client.
 */
function toClientRunResponse(summary: CodeExecutionSummary) {
  return {
    ...summary,
    results: summary.testResults.map((test) => ({
      testIndex: test.testIndex,
      input: test.input,
      expectedOutput: test.expected,
      actualOutput: test.actual ?? null,
      passed: test.passed,
      runtimeMs: test.executionTimeMs,
      error: test.error,
    })),
    passedCount: summary.passed,
    totalCount: summary.total,
    allPassed: summary.success,
  };
}

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
    res.status(500).json({ error: 'Failed to fetch patterns' });
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
    res.status(500).json({ error: 'Failed to fetch problems' });
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
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

/**
 * POST /api/problems/:id/run
 * Run code against sample tests.
 */
router.post(
  '/:id/run',
  authenticate,
  codeExecutionLimiter,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const problemId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
      const parsed = runCodeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { code, language } = parsed.data;
      const result = await problemsService.runCode(problemId, code, language);
      res.json(toClientRunResponse(result));
    } catch (err: any) {
      respondToRouteError(res, 'Error running code', err, 'Failed to run code');
    }
  }
);

/**
 * POST /api/problems/:id/submit
 * Submit code for full evaluation and Socratic AI review.
 */
router.post(
  '/:id/submit',
  authenticate,
  codeExecutionLimiter,
  aiLimiter,
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

      const runResult = toClientRunResponse({
        success: result.success,
        passed: result.testSummary.passed,
        total: result.testSummary.total,
        testResults: result.testSummary.testResults,
        error: result.testSummary.error,
      });

      res.json({
        ...result,
        runResult,
        review: {
          ...result.aiReview,
          estimatedTimeComplexity: result.aiReview.timeComplexity,
          estimatedSpaceComplexity: result.aiReview.spaceComplexity,
          potentialEdgeCasesMissed: result.aiReview.detectedIssues,
          suggestedImprovements: result.aiReview.nextHint
            ? [result.aiReview.nextHint]
            : [],
        },
      });
    } catch (err: any) {
      respondToRouteError(res, 'Error submitting solution', err, 'Failed to submit solution');
    }
  }
);

/**
 * POST /api/problems/:id/hint
 * Request graduated Socratic hint.
 */
router.post(
  '/:id/hint',
  authenticate,
  practiceLimiter,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      respondToRouteError(res, 'Error fetching hint', err, 'Failed to fetch hint');
    }
  }
);

export default router;
