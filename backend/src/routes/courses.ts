/**
 * Course routes.
 *
 * Provides curriculum browsing:
 * - GET /courses — list all courses
 * - GET /courses/:id — get course with its modules
 * - GET /courses/:courseId/modules/:moduleId/topics — get topics for a module
 */

import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/supabase';

export const courseRoutes = Router();

// List all courses
courseRoutes.get('/', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, difficulty')
      .order('title');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ courses: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get a single course with its modules
courseRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, difficulty')
      .eq('id', req.params.id)
      .single();

    if (courseError || !course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, description, sort_order')
      .eq('course_id', req.params.id)
      .order('sort_order');

    if (modulesError) {
      res.status(500).json({ error: modulesError.message });
      return;
    }

    res.json({ ...course, modules: modules || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Get topics for a module
courseRoutes.get(
  '/:courseId/modules/:moduleId/topics',
  async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('topics')
        .select('id, title, description, sort_order')
        .eq('module_id', req.params.moduleId)
        .order('sort_order');

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ topics: data || [] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch topics' });
    }
  }
);
