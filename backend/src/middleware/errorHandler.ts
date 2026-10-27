/**
 * Global error handler middleware.
 *
 * Catches unhandled errors in route handlers and returns a consistent JSON
 * response. Client errors raised by body-parser (malformed JSON, oversized
 * bodies) keep their status code; everything else is reported as a generic
 * 500 so internal details are never leaked to clients.
 *
 * Must be registered LAST in the middleware chain.
 */

import { Request, Response, NextFunction } from 'express';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body is too large' });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }

  const status =
    typeof err.status === 'number'
      ? err.status
      : typeof err.statusCode === 'number'
        ? err.statusCode
        : 500;

  if (status >= 500) {
    console.error('[AlgoMentor] Unhandled error:', err.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message || 'Request failed',
  });
}
