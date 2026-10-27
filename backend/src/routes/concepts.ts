/**
 * Concept routes.
 *
 * Serves the canonical curriculum merge-first (see `src/data/curriculum.ts`),
 * with any additional Supabase rows appended.
 *
 * - GET /concepts/topic/:topicId — list concepts for a topic
 * - GET /concepts/:id — get a single concept
 * - GET /concepts/:id/prerequisites — get prerequisite concepts
 */

import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/supabase';
import {
  getCurriculumConcept,
  getCurriculumConceptsForTopic,
  getCurriculumPrerequisites,
} from '../data/curriculum';

export const conceptRoutes = Router();

interface DbConcept {
  id: string;
  topic_id: string;
  name: string;
  description: string | null;
  difficulty: string | null;
  learning_objectives: string[] | null;
}

// List concepts for a topic
conceptRoutes.get('/topic/:topicId', async (req: Request, res: Response) => {
  const topicId = String(req.params.topicId);
  const canonical = getCurriculumConceptsForTopic(topicId);

  let dbConcepts: DbConcept[] = [];
  try {
    const { data, error } = await getSupabase()
      .from('concepts')
      .select('id, topic_id, name, description, difficulty, learning_objectives')
      .eq('topic_id', topicId)
      .order('name');
    if (!error && data) dbConcepts = data as DbConcept[];
  } catch {
    // Fall back to canonical concepts
  }

  const canonicalIds = new Set(canonical.map((c) => c.id));
  const concepts = [
    ...canonical.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      difficulty: c.difficulty,
    })),
    ...dbConcepts
      .filter((c) => !canonicalIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        difficulty: c.difficulty,
      })),
  ];

  res.json({ concepts });
});

// Get a single concept
conceptRoutes.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const canonical = getCurriculumConcept(id);

  let dbConcept: DbConcept | null = null;
  try {
    const { data, error } = await getSupabase()
      .from('concepts')
      .select('id, topic_id, name, description, difficulty, learning_objectives')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) dbConcept = data as DbConcept;
  } catch {
    // Fall back to canonical concept
  }

  if (canonical) {
    res.json({
      id: canonical.id,
      topic_id: canonical.topicId,
      name: canonical.name,
      description: canonical.description,
      difficulty: canonical.difficulty,
      learning_objectives: canonical.learningObjectives,
      module_id: canonical.moduleId,
      module_title: canonical.moduleTitle,
      course_id: canonical.courseId,
      course_title: canonical.courseTitle,
    });
    return;
  }

  if (dbConcept) {
    res.json(dbConcept);
    return;
  }

  res.status(404).json({ error: 'Concept not found' });
});

// Get prerequisite concepts
conceptRoutes.get('/:id/prerequisites', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const canonical = getCurriculumPrerequisites(id);

  // Also read DB relationships so admin-authored concepts keep working.
  const dbPrereqs: Array<{ id: string; name: string; description: string | null; difficulty: string | null }> = [];
  try {
    const { data: rels, error: relsError } = await getSupabase()
      .from('concept_relationships')
      .select('source_concept_id')
      .eq('target_concept_id', id)
      .eq('relationship_type', 'prerequisite');

    if (!relsError && rels && rels.length > 0) {
      const prereqIds = rels.map((r) => r.source_concept_id);
      const { data: concepts, error: conceptsError } = await getSupabase()
        .from('concepts')
        .select('id, name, description, difficulty')
        .in('id', prereqIds);

      if (!conceptsError && concepts) {
        dbPrereqs.push(...concepts);
      }
    }
  } catch {
    // Canonical graph is sufficient
  }

  const seen = new Set(canonical.map((c) => c.id));
  const prerequisites = [
    ...canonical.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      difficulty: c.difficulty,
    })),
    ...dbPrereqs
      .filter((c) => !seen.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        difficulty: c.difficulty,
      })),
  ];

  res.json({ prerequisites });
});
