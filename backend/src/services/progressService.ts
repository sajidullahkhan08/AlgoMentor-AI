/**
 * Learner progress service.
 *
 * Aggregates the real signals available in the system:
 * - student_knowledge (mastery states & evidence from the tutor)
 * - learning_sessions (active/resumed concepts and activity)
 * - problem attempts (Supabase when present, durable local store otherwise)
 * - revision items/logs (Supabase when present, durable local store otherwise)
 * - curriculum metadata (course grouping and titles)
 */

import { getSupabase } from '../config/supabase';
import {
  CURRICULUM_CONCEPTS,
  CURRICULUM_COURSES,
  getCurriculumConcept,
  getCurriculumPrerequisites,
} from '../data/curriculum';
import { listMisconceptions, listRevisionLogs } from './localStore';
import { problemsService } from './problemsService';
import { revisionService } from './revisionService';

export type MasteryState =
  | 'UNKNOWN'
  | 'INTRODUCED'
  | 'LEARNING'
  | 'DEVELOPING'
  | 'PROFICIENT'
  | 'MASTERED';

interface KnowledgeRow {
  concept_id: string;
  mastery_state: MasteryState;
  confidence: number | null;
  evidence_score: number | null;
  last_assessed: string | null;
  next_review: string | null;
}

interface SessionRow {
  id: string;
  concept_id: string;
  session_type: string;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
}

interface DbMisconceptionRow {
  misconception_tag: string;
  description: string;
  last_detected_at: string;
}

const MASTERED_STATES: MasteryState[] = ['PROFICIENT', 'MASTERED'];

function isMastered(state: MasteryState | undefined): boolean {
  return state ? MASTERED_STATES.includes(state) : false;
}

function toDateKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function computeStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const cursor = new Date();
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

async function fetchKnowledge(userId: string): Promise<KnowledgeRow[]> {
  try {
    const { data, error } = await getSupabase()
      .from('student_knowledge')
      .select('concept_id, mastery_state, confidence, evidence_score, last_assessed, next_review')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data as KnowledgeRow[];
  } catch {
    return [];
  }
}

async function fetchSessions(userId: string): Promise<SessionRow[]> {
  try {
    const { data, error } = await getSupabase()
      .from('learning_sessions')
      .select('id, concept_id, session_type, status, started_at, completed_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data as SessionRow[];
  } catch {
    return [];
  }
}

async function fetchDbMisconceptions(userId: string): Promise<DbMisconceptionRow[]> {
  try {
    const { data, error } = await getSupabase()
      .from('student_misconceptions')
      .select('misconception_tag, description, last_detected_at')
      .eq('user_id', userId)
      .order('last_detected_at', { ascending: false })
      .limit(20);
    if (error || !data) return [];
    return data as DbMisconceptionRow[];
  } catch {
    return [];
  }
}

async function resolveConceptNames(ids: string[]): Promise<Map<string, { name: string; courseTitle: string }>> {
  const names = new Map<string, { name: string; courseTitle: string }>();
  const missing: string[] = [];

  for (const id of ids) {
    const seed = getCurriculumConcept(id);
    if (seed) {
      names.set(id, { name: seed.name, courseTitle: seed.courseTitle });
    } else if (!missing.includes(id)) {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    try {
      const { data } = await getSupabase()
        .from('concepts')
        .select('id, name')
        .in('id', missing);
      for (const row of data || []) {
        names.set(row.id, { name: row.name, courseTitle: 'Additional concepts' });
      }
    } catch {
      // Unknown DB-only concepts will fall back to a generic label
    }
  }

  return names;
}

export class ProgressService {
  async getSummary(userId: string) {
    const [knowledge, sessions, dbMisconceptions, attempts, revisionStats, dueQueue, problems, patterns] =
      await Promise.all([
        fetchKnowledge(userId),
        fetchSessions(userId),
        fetchDbMisconceptions(userId),
        problemsService.getUserAttempts(userId),
        revisionService.getStats(userId),
        revisionService.getDueQueue(userId),
        problemsService.getProblems(),
        problemsService.getPatterns(),
      ]);

    const knowledgeByConcept = new Map(knowledge.map((k) => [k.concept_id, k]));
    const conceptIds = Array.from(
      new Set([
        ...knowledge.map((k) => k.concept_id),
        ...sessions.map((s) => s.concept_id),
      ])
    );
    const conceptNames = await resolveConceptNames(conceptIds);

    const totalConcepts = CURRICULUM_CONCEPTS.length;
    const tracked = knowledge.length;
    const mastered = knowledge.filter((k) => isMastered(k.mastery_state)).length;
    const inProgress = knowledge.filter(
      (k) => !isMastered(k.mastery_state) && k.mastery_state !== 'UNKNOWN'
    ).length;
    const masteryPercent = totalConcepts > 0 ? Math.round((mastered / totalConcepts) * 100) : 0;

    const evidenceValues = knowledge
      .map((k) => k.evidence_score)
      .filter((v): v is number => typeof v === 'number');
    const avgEvidence =
      evidenceValues.length > 0
        ? Math.round((evidenceValues.reduce((a, b) => a + b, 0) / evidenceValues.length) * 100)
        : 0;

    // --- Weak topics -------------------------------------------------
    const weakTopics = knowledge
      .filter((k) => !isMastered(k.mastery_state))
      .map((k) => {
        const concept = getCurriculumConcept(k.concept_id);
        const meta = conceptNames.get(k.concept_id);
        const evidence = k.evidence_score ?? 0;
        let reason = 'Needs reinforcement';
        if (k.mastery_state === 'INTRODUCED') reason = 'Just introduced — practice recall';
        else if (k.mastery_state === 'LEARNING') reason = 'Still building understanding';
        else if (k.mastery_state === 'DEVELOPING' && evidence < 0.4) reason = 'Low evidence — revisit fundamentals';
        return {
          conceptId: k.concept_id,
          name: concept?.name || meta?.name || 'Concept',
          courseTitle: concept?.courseTitle || meta?.courseTitle || '',
          masteryState: k.mastery_state,
          evidenceScore: Math.round(evidence * 100),
          lastAssessed: k.last_assessed,
          reason,
        };
      })
      .sort((a, b) => a.evidenceScore - b.evidenceScore)
      .slice(0, 5);

    // --- Continue learning -------------------------------------------
    const activeSessions = sessions.filter((s) => s.status === 'active');
    const seenConcepts = new Set<string>();
    const continueLearning: Array<Record<string, unknown>> = [];

    for (const session of activeSessions) {
      if (seenConcepts.has(session.concept_id)) continue;
      seenConcepts.add(session.concept_id);
      const concept = getCurriculumConcept(session.concept_id);
      const meta = conceptNames.get(session.concept_id);
      continueLearning.push({
        conceptId: session.concept_id,
        name: concept?.name || meta?.name || 'Concept',
        courseTitle: concept?.courseTitle || meta?.courseTitle || '',
        sessionId: session.id,
        startedAt: session.started_at,
        masteryState: knowledgeByConcept.get(session.concept_id)?.mastery_state || 'UNKNOWN',
        recommended: false,
        reason: 'Resume active tutoring session',
      });
      if (continueLearning.length >= 3) break;
    }

    if (continueLearning.length === 0) {
      for (const concept of CURRICULUM_CONCEPTS) {
        if (knowledgeByConcept.has(concept.id)) continue;
        continueLearning.push({
          conceptId: concept.id,
          name: concept.name,
          courseTitle: concept.courseTitle,
          sessionId: null,
          startedAt: null,
          masteryState: 'UNKNOWN',
          recommended: true,
          reason: `Recommended next concept in ${concept.courseTitle}`,
        });
        if (continueLearning.length >= 3) break;
      }
    }

    // --- Recent activity --------------------------------------------
    type Activity = {
      type: 'tutoring' | 'problem' | 'revision';
      title: string;
      detail: string;
      status?: string;
      timestamp: string;
    };
    const activity: Activity[] = [];

    for (const session of sessions.slice(0, 20)) {
      const meta = conceptNames.get(session.concept_id);
      activity.push({
        type: 'tutoring',
        title: meta?.name || 'Tutoring session',
        detail:
          session.status === 'active'
            ? 'Session in progress'
            : session.session_type === 'assessment'
              ? 'Assessment completed'
              : 'Tutoring session completed',
        status: session.status,
        timestamp: session.completed_at || session.started_at,
      });
    }

    for (const attempt of attempts.slice(0, 20)) {
      activity.push({
        type: 'problem',
        title: attempt.problem_title,
        detail:
          attempt.status === 'failed'
            ? `Attempted — ${attempt.passed}/${attempt.total} tests passed`
            : `Solved — ${attempt.passed}/${attempt.total} tests passed`,
        status: attempt.status,
        timestamp: attempt.created_at,
      });
    }

    for (const log of listRevisionLogs(userId).slice(0, 20)) {
      activity.push({
        type: 'revision',
        title: log.item_title,
        detail: `Spaced retrieval review — rating ${log.rating}/5`,
        status: log.rating >= 3 ? 'reviewed' : 'relearn',
        timestamp: log.created_at,
      });
    }

    const recentActivity = activity
      .filter((a) => Boolean(a.timestamp))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10);

    // --- Streak ------------------------------------------------------
    const activityDays = new Set<string>();
    for (const session of sessions) {
      const started = toDateKey(session.started_at);
      if (started) activityDays.add(started);
      const completed = toDateKey(session.completed_at);
      if (completed) activityDays.add(completed);
    }
    for (const attempt of attempts) {
      const day = toDateKey(attempt.created_at);
      if (day) activityDays.add(day);
    }
    for (const log of listRevisionLogs(userId)) {
      const day = toDateKey(log.created_at);
      if (day) activityDays.add(day);
    }
    for (const row of knowledge) {
      const day = toDateKey(row.last_assessed);
      if (day) activityDays.add(day);
    }
    const currentStreakDays = computeStreak(activityDays);

    // --- Course progress --------------------------------------------
    const knowledgeStates = new Map(knowledge.map((k) => [k.concept_id, k.mastery_state]));
    const courseProgress = CURRICULUM_COURSES.map((course) => {
      const courseConcepts = CURRICULUM_CONCEPTS.filter((c) => c.courseId === course.id);
      const courseTracked = courseConcepts.filter((c) => knowledgeStates.has(c.id)).length;
      const courseMastered = courseConcepts.filter((c) =>
        isMastered(knowledgeStates.get(c.id))
      ).length;
      const courseInProgress = courseConcepts.filter((c) => {
        const state = knowledgeStates.get(c.id);
        return state && state !== 'UNKNOWN' && !isMastered(state);
      }).length;
      return {
        courseId: course.id,
        title: course.title,
        difficulty: course.difficulty,
        totalConcepts: courseConcepts.length,
        trackedConcepts: courseTracked,
        masteredConcepts: courseMastered,
        inProgressConcepts: courseInProgress,
        masteryPercent:
          courseConcepts.length > 0
            ? Math.round((courseMastered / courseConcepts.length) * 100)
            : 0,
      };
    });

    // --- Attempts ----------------------------------------------------
    const attemptedProblems = new Set(attempts.map((a) => a.problem_id));
    const solvedProblems = new Set(
      attempts.filter((a) => a.status !== 'failed').map((a) => a.problem_id)
    );

    // --- Misconceptions ---------------------------------------------
    const localMisconceptions = listMisconceptions(userId);
    const misconceptionByTag = new Map(
      localMisconceptions.map((m) => [m.tag, { ...m, last_detected_at: m.last_detected_at }])
    );
    for (const row of dbMisconceptions) {
      if (!misconceptionByTag.has(row.misconception_tag)) {
        misconceptionByTag.set(row.misconception_tag, {
          tag: row.misconception_tag,
          description: row.description,
          last_detected_at: row.last_detected_at,
          occurrences: 1,
        });
      }
    }
    const misconceptions = Array.from(misconceptionByTag.values())
      .sort((a, b) => b.last_detected_at.localeCompare(a.last_detected_at))
      .slice(0, 5);

    return {
      overview: {
        totalConcepts,
        conceptsTracked: tracked,
        conceptsMastered: mastered,
        conceptsInProgress: inProgress,
        masteryPercent,
        avgEvidencePercent: avgEvidence,
        totalProblems: problems.length,
        problemsAttempted: attemptedProblems.size,
        problemsSolved: solvedProblems.size,
        totalPatterns: patterns.length,
        dueReviews: revisionStats.dueTodayCount,
        retentionRatePercent: revisionStats.retentionRatePercent,
        currentStreakDays,
        activeSessions: new Set(activeSessions.map((s) => s.concept_id)).size,
        misconceptionCount: misconceptions.length,
      },
      continueLearning,
      weakTopics,
      recentActivity,
      courseProgress,
      revision: {
        totalItems: revisionStats.totalItems,
        dueTodayCount: revisionStats.dueTodayCount,
        masteredCount: revisionStats.masteredCount,
        boxDistribution: revisionStats.boxDistribution,
        retentionRatePercent: revisionStats.retentionRatePercent,
        nextDueAt: dueQueue.upcomingItems[0]?.next_review_date || null,
      },
      misconceptions,
      generatedAt: new Date().toISOString(),
    };
  }

  async getConceptProgress(userId: string, conceptId: string) {
    const seed = getCurriculumConcept(conceptId);
    if (!seed) {
      throw new Error('Concept not found');
    }

    const knowledge = await fetchKnowledge(userId);
    const row = knowledge.find((k) => k.concept_id === conceptId);

    const sessions = (await fetchSessions(userId)).filter((s) => s.concept_id === conceptId);
    const activeSession = sessions.find((s) => s.status === 'active');

    const prerequisites = await Promise.all(
      getCurriculumPrerequisites(conceptId).map(async (prereq) => {
        const prereqKnowledge = knowledge.find((k) => k.concept_id === prereq.id);
        return {
          id: prereq.id,
          name: prereq.name,
          difficulty: prereq.difficulty,
          masteryState: prereqKnowledge?.mastery_state || 'UNKNOWN',
          evidenceScore: Math.round((prereqKnowledge?.evidence_score ?? 0) * 100),
          isMastered: isMastered(prereqKnowledge?.mastery_state),
        };
      })
    );

    const state = row?.mastery_state || ('UNKNOWN' as MasteryState);
    const evidence = row?.evidence_score ?? 0;

    let recommendation: 'start' | 'practice' | 'advance' | 'review' = 'start';
    if (isMastered(state)) recommendation = 'review';
    else if (state === 'UNKNOWN') recommendation = 'start';
    else if (evidence >= 0.7) recommendation = 'advance';
    else recommendation = 'practice';

    return {
      conceptId,
      name: seed.name,
      courseTitle: seed.courseTitle,
      moduleTitle: seed.moduleTitle,
      topicTitle: seed.topicTitle,
      masteryState: state,
      evidenceScore: Math.round(evidence * 100),
      confidence: row?.confidence ?? null,
      lastAssessed: row?.last_assessed ?? null,
      nextReview: row?.next_review ?? null,
      sessionsCount: sessions.length,
      completedSessions: sessions.filter((s) => s.status === 'completed').length,
      activeSessionId: activeSession?.id ?? null,
      lastSessionAt: sessions[0]?.started_at ?? null,
      prerequisites,
      recommendation,
    };
  }
}

export const progressService = new ProgressService();
