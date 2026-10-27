/**
 * Durable local JSON store.
 *
 * Supabase is the source of truth when the optional tables from migrations
 * 003–005 exist. On environments where those tables have not been applied
 * (including the current live project), attempts, revision progress, and
 * misconceptions are persisted here instead of being lost on restart.
 *
 * The store is intentionally single-process. For multi-instance deployments,
 * apply all migrations and rely on Postgres.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface StoredAttempt {
  id: string;
  user_id: string;
  problem_id: string;
  problem_title: string;
  language: string;
  status: 'solved_independently' | 'passed' | 'failed';
  passed: number;
  total: number;
  hints_used: number;
  detected_issues: string[];
  created_at: string;
}

export interface StoredRevisionItem {
  id: string;
  user_id: string;
  item_type: 'concept' | 'problem' | 'invariant';
  title: string;
  prompt_question: string;
  solution_explanation: string;
  key_invariant: string;
  repetition_count: number;
  interval_days: number;
  easiness_factor: number;
  leitner_box: number;
  next_review_date: string;
  last_reviewed_at?: string | null;
  weakness_flags: string[];
  concept_id?: string | null;
  problem_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StoredRevisionLog {
  id: string;
  user_id: string;
  item_id: string;
  item_title: string;
  rating: number;
  confidence: string;
  time_spent_seconds: number;
  created_at: string;
}

export interface StoredMisconception {
  tag: string;
  description: string;
  last_detected_at: string;
  occurrences: number;
}

interface StoreData {
  version: 1;
  attempts: StoredAttempt[];
  revisionItems: Record<string, StoredRevisionItem[]>;
  revisionLogs: StoredRevisionLog[];
  misconceptions: Record<string, StoredMisconception[]>;
}

const EMPTY_STORE: StoreData = {
  version: 1,
  attempts: [],
  revisionItems: {},
  revisionLogs: [],
  misconceptions: {},
};

const STORE_PATH =
  process.env.LOCAL_STORE_PATH || path.join(process.cwd(), 'data', 'local-store.json');

function readStore(): StoreData {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      version: 1,
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      revisionItems:
        parsed.revisionItems && typeof parsed.revisionItems === 'object'
          ? parsed.revisionItems
          : {},
      revisionLogs: Array.isArray(parsed.revisionLogs) ? parsed.revisionLogs : [],
      misconceptions:
        parsed.misconceptions && typeof parsed.misconceptions === 'object'
          ? parsed.misconceptions
          : {},
    };
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      console.warn('[LocalStore] Could not read store, starting empty:', err?.message);
    }
    return { ...EMPTY_STORE };
  }
}

function writeStore(data: StoreData): void {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  const tmpPath = `${STORE_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
}

// --- Attempts -------------------------------------------------------

export function listAttempts(userId: string): StoredAttempt[] {
  return readStore()
    .attempts.filter((a) => a.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function addAttempt(
  attempt: Omit<StoredAttempt, 'id' | 'created_at'> & { created_at?: string }
): StoredAttempt {
  const record: StoredAttempt = {
    ...attempt,
    id: crypto.randomUUID(),
    created_at: attempt.created_at || new Date().toISOString(),
  };
  const data = readStore();
  data.attempts.push(record);
  writeStore(data);
  return record;
}

// --- Revision -------------------------------------------------------

export function getRevisionItems(userId: string): StoredRevisionItem[] | null {
  const items = readStore().revisionItems[userId];
  return Array.isArray(items) ? items : null;
}

export function saveRevisionItems(userId: string, items: StoredRevisionItem[]): void {
  const data = readStore();
  data.revisionItems[userId] = items;
  writeStore(data);
}

export function addRevisionLog(
  log: Omit<StoredRevisionLog, 'id' | 'created_at'>
): StoredRevisionLog {
  const record: StoredRevisionLog = {
    ...log,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const data = readStore();
  data.revisionLogs.push(record);
  writeStore(data);
  return record;
}

export function listRevisionLogs(userId: string): StoredRevisionLog[] {
  return readStore()
    .revisionLogs.filter((l) => l.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// --- Misconceptions -------------------------------------------------

export function listMisconceptions(userId: string): StoredMisconception[] {
  return readStore().misconceptions[userId] || [];
}

export function recordMisconceptions(userId: string, issues: string[]): void {
  if (issues.length === 0) return;
  const data = readStore();
  const existing = data.misconceptions[userId] || [];
  const byTag = new Map(existing.map((m) => [m.tag, m]));
  const now = new Date().toISOString();

  for (const description of issues) {
    const tag = description.slice(0, 50);
    const current = byTag.get(tag);
    byTag.set(tag, {
      tag,
      description,
      last_detected_at: now,
      occurrences: (current?.occurrences || 0) + 1,
    });
  }

  data.misconceptions[userId] = Array.from(byTag.values());
  writeStore(data);
}

export function getStorePath(): string {
  return STORE_PATH;
}
