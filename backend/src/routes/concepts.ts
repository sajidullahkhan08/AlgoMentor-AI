/**
 * Concept routes.
 *
 * Provides concept detail and prerequisite browsing:
 * - GET /concepts/topic/:topicId — list concepts for a topic
 * - GET /concepts/:id — get a single concept
 * - GET /concepts/:id/prerequisites — get prerequisite concepts
 */

import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/supabase';

export const conceptRoutes = Router();

// List concepts for a topic
conceptRoutes.get('/topic/:topicId', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('concepts')
      .select('id, name, description, difficulty')
      .eq('topic_id', req.params.topicId)
      .order('name');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ concepts: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch concepts' });
  }
});

// Get a single concept
conceptRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('concepts')
      .select('id, name, description, difficulty, learning_objectives')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Concept not found' });
      return;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch concept' });
  }
});

// Get prerequisite concepts
conceptRoutes.get(
  '/:id/prerequisites',
  async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();

      // Get concept_relationships where this concept is the target
      // and relationship_type is 'prerequisite'
      const { data: rels, error: relsError } = await supabase
        .from('concept_relationships')
        .select('source_concept_id')
        .eq('target_concept_id', req.params.id)
        .eq('relationship_type', 'prerequisite');

      if (relsError) {
        res.status(500).json({ error: relsError.message });
        return;
      }

      if (!rels || rels.length === 0) {
        res.json({ prerequisites: [] });
        return;
      }

      const prereqIds = rels.map((r) => r.source_concept_id);

      const { data: concepts, error: conceptsError } = await supabase
        .from('concepts')
        .select('id, name, description, difficulty')
        .in('id', prereqIds);

      if (conceptsError) {
        res.status(500).json({ error: conceptsError.message });
        return;
      }

      res.json({ prerequisites: concepts || [] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch prerequisites' });
    }
  }
);
