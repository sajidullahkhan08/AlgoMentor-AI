/**
 * Course routes.
 *
 * Serves the canonical curriculum defined in `src/data/curriculum.ts`, merged
 * with any additional rows stored in Supabase. The canonical seed always wins
 * for known IDs, while DB-only content (e.g. admin-authored courses) is kept.
 *
 * - GET /courses — list all courses
 * - GET /courses/:id — get course with its modules
 * - GET /courses/:courseId/modules/:moduleId/topics — get topics for a module
 */

import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/supabase';
import {
  CURRICULUM_COURSES,
  getCurriculumCourse,
  getCurriculumCourseOrder,
  getCurriculumModules,
} from '../data/curriculum';

export const courseRoutes = Router();

interface DbCourse {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
}

interface DbModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
}

interface DbTopic {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
}

async function safeSelect<T>(table: string, select: string): Promise<T[]> {
  try {
    const { data, error } = await getSupabase().from(table).select(select);
    if (error || !data) return [];
    return data as T[];
  } catch {
    return [];
  }
}

// List all courses
courseRoutes.get('/', async (_req: Request, res: Response) => {
  const dbCourses = await safeSelect<DbCourse>(
    'courses',
    'id, title, description, difficulty'
  );
  const dbById = new Map(dbCourses.map((c) => [c.id, c]));

  const canonical = CURRICULUM_COURSES.map((course) => {
    const db = dbById.get(course.id);
    return {
      id: course.id,
      title: course.title,
      description: db?.description || course.description,
      difficulty: db?.difficulty || course.difficulty,
    };
  });

  const extras = dbCourses
    .filter((c) => !getCurriculumCourse(c.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const courses = [...canonical, ...extras].sort((a, b) => {
    const order = getCurriculumCourseOrder(a.id) - getCurriculumCourseOrder(b.id);
    return order !== 0 ? order : a.title.localeCompare(b.title);
  });

  res.json({ courses });
});

// Get a single course with its modules
courseRoutes.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const canonical = getCurriculumCourse(id);

  let dbCourse: DbCourse | null = null;
  let dbModules: DbModule[] = [];
  try {
    const { data: course } = await getSupabase()
      .from('courses')
      .select('id, title, description, difficulty')
      .eq('id', id)
      .maybeSingle();
    dbCourse = (course as DbCourse | null) ?? null;

    if (dbCourse) {
      const { data: modules } = await getSupabase()
        .from('modules')
        .select('id, course_id, title, description, sort_order')
        .eq('course_id', id)
        .order('sort_order');
      dbModules = (modules as DbModule[] | null) ?? [];
    }
  } catch {
    // Fall back to canonical curriculum below
  }

  if (!canonical && !dbCourse) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }

  const moduleById = new Map(dbModules.map((m) => [m.id, m]));
  const canonicalModules = canonical ? getCurriculumModules(canonical.id) : [];
  const canonicalModuleIds = new Set(canonicalModules.map((m) => m.id));

  const modules = [
    ...canonicalModules.map((mod) => {
      const db = moduleById.get(mod.id);
      return {
        id: mod.id,
        title: mod.title,
        description: db?.description || mod.description,
        sort_order: mod.sortOrder,
      };
    }),
    ...dbModules
      .filter((m) => !canonicalModuleIds.has(m.id))
      .map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        sort_order: m.sort_order ?? 0,
      })),
  ].sort((a, b) => a.sort_order - b.sort_order);

  res.json({
    id,
    title: canonical?.title || dbCourse?.title,
    description: canonical?.description || dbCourse?.description,
    difficulty: canonical?.difficulty || dbCourse?.difficulty,
    modules,
  });
});

// Get topics for a module
courseRoutes.get(
  '/:courseId/modules/:moduleId/topics',
  async (req: Request, res: Response) => {
    const courseId = String(req.params.courseId);
    const moduleId = String(req.params.moduleId);

    const canonicalCourse = getCurriculumCourse(courseId);
    const canonicalTopic = canonicalCourse
      ? getCurriculumModules(courseId).find((m) => m.id === moduleId)
      : undefined;

    let dbTopics: DbTopic[] = [];
    try {
      const { data, error } = await getSupabase()
        .from('topics')
        .select('id, module_id, title, description, sort_order')
        .eq('module_id', moduleId)
        .order('sort_order');
      if (!error && data) dbTopics = data as DbTopic[];
    } catch {
      // Fall back to canonical topic list
    }

    if (!canonicalTopic && dbTopics.length === 0) {
      res.json({ topics: [] });
      return;
    }

    const dbById = new Map(dbTopics.map((t) => [t.id, t]));
    const seedTopics = canonicalTopic?.topics ?? [];
    const seedIds = new Set(seedTopics.map((t) => t.id));

    const topics = [
      ...seedTopics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: dbById.get(topic.id)?.description || topic.description,
        sort_order: topic.sortOrder,
      })),
      ...dbTopics
        .filter((t) => !seedIds.has(t.id))
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          sort_order: t.sort_order ?? 0,
        })),
    ].sort((a, b) => a.sort_order - b.sort_order);

    res.json({ topics });
  }
);
