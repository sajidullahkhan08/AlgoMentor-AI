/**
 * Idempotently seeds the canonical curriculum into Supabase.
 *
 * Usage (from backend/):
 *   npm run seed:curriculum
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role bypasses
 * RLS; never expose it to the mobile app). Safe to run repeatedly: every row
 * is upserted by its deterministic UUID.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  CURRICULUM_COURSES,
  CURRICULUM_MODULES,
  CURRICULUM_TOPICS,
  CURRICULUM_COUNTS,
  getPrerequisiteEdges,
} from '../src/data/curriculum';
import { SEED_PATTERNS, SEED_PROBLEMS } from '../src/services/problemsService';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict?: string,
  chunkSize = 100
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, onConflict ? { onConflict } : undefined);
    if (error) {
      throw new Error(`${table} upsert failed: ${error.message}`);
    }
  }
}

async function main() {
  console.log(
    `Seeding ${CURRICULUM_COUNTS.courses} courses, ${CURRICULUM_COUNTS.modules} modules, ` +
      `${CURRICULUM_COUNTS.topics} topics, ${CURRICULUM_COUNTS.concepts} concepts, ` +
      `${CURRICULUM_COUNTS.relationships} relationships, ${SEED_PATTERNS.length} patterns, ` +
      `${SEED_PROBLEMS.length} problems.`
  );

  await upsert(
    'courses',
    CURRICULUM_COURSES.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
    })),
    'id'
  );

  await upsert(
    'modules',
    CURRICULUM_MODULES.map((m) => ({
      id: m.id,
      course_id: m.courseId,
      title: m.title,
      description: m.description,
      sort_order: m.sortOrder,
    })),
    'id'
  );

  await upsert(
    'topics',
    CURRICULUM_TOPICS.map((t) => ({
      id: t.id,
      module_id: t.moduleId,
      title: t.title,
      description: t.description,
      sort_order: t.sortOrder,
    })),
    'id'
  );

  await upsert(
    'concepts',
    CURRICULUM_MODULES.flatMap((m) =>
      m.topics.flatMap((t) =>
        t.concepts.map((c) => ({
          id: c.id,
          topic_id: t.id,
          name: c.name,
          description: c.description,
          difficulty: c.difficulty,
          learning_objectives: c.learningObjectives,
        }))
      )
    ),
    'id'
  );

  await upsert(
    'concept_relationships',
    getPrerequisiteEdges().map((edge) => ({
      source_concept_id: edge.source,
      target_concept_id: edge.target,
      relationship_type: edge.type,
    })),
    'source_concept_id,target_concept_id,relationship_type'
  );

  await upsert(
    'patterns',
    SEED_PATTERNS.map((pattern) => ({
      id: pattern.id,
      name: pattern.name,
      description: pattern.description,
      difficulty: pattern.difficulty,
      recognition_signals: pattern.recognition_signals,
      common_mistakes: pattern.common_mistakes,
      sort_order: pattern.sort_order,
    })),
    'id'
  );

  await upsert(
    'problems',
    SEED_PROBLEMS.map((problem, index) => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      category: problem.category,
      pattern_id: problem.pattern_id,
      constraints: problem.constraints,
      examples: problem.examples,
      starter_code: problem.starter_code,
      test_cases: problem.test_cases,
      sort_order: index + 1,
    })),
    'id'
  );

  // Verify every canonical concept, pattern, and problem resolves from the database.
  const conceptIds = CURRICULUM_MODULES.flatMap((m) =>
    m.topics.flatMap((t) => t.concepts.map((c) => c.id))
  );
  const { data, error } = await supabase
    .from('concepts')
    .select('id')
    .in('id', conceptIds);

  if (error) {
    throw new Error(`Verification failed: ${error.message}`);
  }

  const found = new Set((data || []).map((row) => row.id));
  const missing = conceptIds.filter((id) => !found.has(id));

  if (missing.length > 0) {
    throw new Error(`Seed verification failed, missing concepts: ${missing.join(', ')}`);
  }

  const { data: patternRows, error: patternError } = await supabase
    .from('patterns')
    .select('id')
    .in('id', SEED_PATTERNS.map((p) => p.id));
  if (patternError) {
    throw new Error(`Pattern verification failed: ${patternError.message}`);
  }
  if ((patternRows || []).length !== SEED_PATTERNS.length) {
    throw new Error(
      `Seed verification failed: found ${patternRows?.length || 0} of ${SEED_PATTERNS.length} patterns`
    );
  }

  const { data: problemRows, error: problemError } = await supabase
    .from('problems')
    .select('id')
    .in('id', SEED_PROBLEMS.map((p) => p.id));
  if (problemError) {
    throw new Error(`Problem verification failed: ${problemError.message}`);
  }
  if ((problemRows || []).length !== SEED_PROBLEMS.length) {
    throw new Error(
      `Seed verification failed: found ${problemRows?.length || 0} of ${SEED_PROBLEMS.length} problems`
    );
  }

  console.log(
    `Verified ${found.size} concepts, ${patternRows!.length} patterns, and ${problemRows!.length} problems in the database. Curriculum seed complete.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
