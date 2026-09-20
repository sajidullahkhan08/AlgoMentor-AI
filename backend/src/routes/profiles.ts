/**
 * Profile routes (authenticated).
 *
 * - GET /profiles/me — get the current user's profile
 * - PUT /profiles/me — update the current user's profile
 */

import { Router, Response } from 'express';
import {
  authenticate,
  AuthenticatedRequest,
} from '../middleware/authenticate';
import { getSupabase } from '../config/supabase';

export const profileRoutes = Router();

// All profile routes require authentication
profileRoutes.use(authenticate);

// Get current user's profile
profileRoutes.get(
  '/me',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, experience_level, preferred_language')
        .eq('user_id', req.userId!)
        .single();

      if (error || !data) {
        // Profile might not exist yet — return empty profile
        res.json({
          user_id: req.userId,
          display_name: null,
          experience_level: null,
          preferred_language: null,
        });
        return;
      }

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

// Update current user's profile
profileRoutes.put(
  '/me',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { display_name, experience_level, preferred_language } = req.body;

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: req.userId!,
            display_name,
            experience_level,
            preferred_language,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);
