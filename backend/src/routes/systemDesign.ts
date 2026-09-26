/**
 * System Design Routes (Phase 9).
 *
 * Implements endpoints for exploring architectural scenarios,
 * inspecting scale requirements, and submitting designs for Socratic evaluation.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { systemDesignService } from '../services/systemDesignService';

const router = Router();

const evaluateDesignSchema = z.object({
  scenarioId: z.string().min(1, 'Scenario ID is required'),
  selectedComponentIds: z.array(z.string()).min(1, 'Select at least one component'),
  userExplanation: z.string().min(10, 'Provide an explanation of your architectural choices'),
  answeredTradeOffs: z
    .array(
      z.object({
        questionId: z.string(),
        choice: z.string(),
      })
    )
    .optional(),
});

/**
 * GET /api/system-design/scenarios
 * List all available system design scenarios.
 */
router.get('/scenarios', async (_req: Request, res: Response): Promise<void> => {
  try {
    const scenarios = await systemDesignService.getScenarios();
    res.json(scenarios);
  } catch (err: any) {
    console.error('[SystemDesignRoutes] Error fetching scenarios:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch scenarios' });
  }
});

/**
 * GET /api/system-design/scenarios/:id
 * Retrieve details for a specific scenario.
 */
router.get('/scenarios/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const scenario = await systemDesignService.getScenario(id);
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }
    res.json(scenario);
  } catch (err: any) {
    console.error('[SystemDesignRoutes] Error fetching scenario:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch scenario' });
  }
});

/**
 * POST /api/system-design/evaluate
 * Submit architectural proposal for Socratic review.
 */
router.post('/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = evaluateDesignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { scenarioId, selectedComponentIds, userExplanation, answeredTradeOffs } = parsed.data;
    const review = await systemDesignService.evaluateDesign(
      scenarioId,
      selectedComponentIds,
      userExplanation,
      answeredTradeOffs
    );

    res.json(review);
  } catch (err: any) {
    console.error('[SystemDesignRoutes] Error evaluating design:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate system design' });
  }
});

export default router;
