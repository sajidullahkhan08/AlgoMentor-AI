/**
 * Authentication middleware.
 *
 * Verifies the Supabase JWT from the Authorization header.
 * Per DEC-PEN-02: Supabase Auth is client-side; the backend validates JWTs.
 *
 * Usage: app.use('/api/protected', authenticate, protectedRoutes);
 */

import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user info to request for downstream handlers
    req.userId = data.user.id;
    req.userEmail = data.user.email;

    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}
