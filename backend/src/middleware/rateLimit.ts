/**
 * Lightweight in-memory rate limiting.
 *
 * Fixed-window counters keyed by authenticated user (preferred) or client IP.
 * This is intentionally dependency-free and process-local: it protects a
 * single backend instance from accidental or abusive bursts. Deployments with
 * multiple instances should put a shared limiter (gateway/Redis) in front.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';

export interface RateLimitOptions {
  /** Human-readable bucket name, also part of the storage key. */
  name: string;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed per key per window. */
  max: number;
  /** Optional custom key. Defaults to the authenticated user or client IP. */
  keyGenerator?: (req: AuthenticatedRequest) => string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweepExpired(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function defaultKey(req: AuthenticatedRequest): string {
  return req.userId || req.ip || req.socket.remoteAddress || 'unknown';
}

export function rateLimit(options: RateLimitOptions) {
  const { name, windowMs, max, keyGenerator = defaultKey } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    sweepExpired(now);

    const identifier = keyGenerator(req as AuthenticatedRequest);
    const key = `${name}:${identifier}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        error: 'Too many requests. Please slow down and try again shortly.',
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

/** Broad protection for the whole API surface, keyed by IP. */
export const globalApiLimiter = rateLimit({
  name: 'global',
  windowMs: 60_000,
  max: 300,
});

/** Expensive sandbox execution: per-user budget. */
export const codeExecutionLimiter = rateLimit({
  name: 'code-exec',
  windowMs: 60_000,
  max: 20,
});

/** Endpoints that trigger an AI provider call. */
export const aiLimiter = rateLimit({
  name: 'ai',
  windowMs: 60_000,
  max: 20,
});

/** Authenticated practice endpoints that are cheap but should be bounded. */
export const practiceLimiter = rateLimit({
  name: 'practice',
  windowMs: 60_000,
  max: 60,
});
