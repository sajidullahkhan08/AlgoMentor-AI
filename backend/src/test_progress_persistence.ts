/**
 * Automated verification for durable local persistence and progress reporting.
 *
 * Runs without Supabase by pointing the client at an unreachable local port,
 * forcing every service onto its durable JSON fallback.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const storePath = path.join(os.tmpdir(), `algomentor-store-test-${process.pid}.json`);
process.env.LOCAL_STORE_PATH = storePath;
process.env.SUPABASE_URL = 'http://127.0.0.1:9';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
delete process.env.GEMINI_API_KEY;

async function main() {
  console.log('=== AlgoMentor AI — Durable Persistence & Progress Verification ===\n');

  const localStore = await import('./services/localStore');
  const { revisionService } = await import('./services/revisionService');
  const { progressService } = await import('./services/progressService');
  const { CURRICULUM_CONCEPTS } = await import('./data/curriculum');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
    }
  }

  const userId = 'test-progress-user';

  try {
    localStore.addAttempt({
      user_id: userId,
      problem_id: '66666666-0001-0001-0001-000000000001',
      problem_title: 'Binary Search',
      language: 'javascript',
      status: 'solved_independently',
      passed: 6,
      total: 6,
      hints_used: 0,
      detected_issues: [],
    });
    localStore.addAttempt({
      user_id: userId,
      problem_id: '66666666-0001-0001-0001-000000000004',
      problem_title: 'Two Sum',
      language: 'javascript',
      status: 'failed',
      passed: 1,
      total: 3,
      hints_used: 1,
      detected_issues: ['Missing complement lookup'],
    });
    localStore.recordMisconceptions(userId, ['Off-by-one in binary search boundary']);

    assert(localStore.listAttempts(userId).length === 2, 'Attempts are stored durably');
    assert(fs.existsSync(storePath), 'Local store file is created on disk');

    const queue = await revisionService.getDueQueue(userId);
    assert(queue.dueItems.length > 0, 'Revision queue seeds when database tables are absent');

    const reviewed = await revisionService.reviewItem(
      userId,
      queue.dueItems[0].id,
      4,
      'confident',
      20
    );
    assert(reviewed.intervalDays >= 1, 'Revision reviews persist through the local fallback');

    const persistedItems = localStore.getRevisionItems(userId);
    assert(
      Boolean(persistedItems?.some((item) => item.repetition_count > 0)),
      'Updated revision state survives a fresh read from disk'
    );
    assert(localStore.listRevisionLogs(userId).length === 1, 'Revision reviews are logged durably');

    const stats = await revisionService.getStats(userId);
    assert(stats.totalItems >= 4, 'Revision stats are computed from the durable store');
    assert(stats.currentStreakDays === 1, 'Streak is derived from real review activity');

    const summary = await progressService.getSummary(userId);
    assert(summary.overview.totalConcepts === 40, 'Progress reports 40 canonical concepts');
    assert(summary.overview.totalProblems === 30, 'Progress reports 30 canonical problems');
    assert(summary.overview.totalPatterns === 15, 'Progress reports 15 canonical patterns');
    assert(summary.overview.problemsAttempted === 2, 'Progress counts unique attempted problems');
    assert(summary.overview.problemsSolved === 1, 'Progress counts problems solved at least once');
    assert(summary.overview.currentStreakDays === 1, 'Progress streak reflects durable activity');
    assert(summary.overview.misconceptionCount === 1, 'Progress surfaces locally recorded misconceptions');
    assert(summary.courseProgress.length === 3, 'Progress reports all three courses');
    assert(
      summary.courseProgress.reduce((sum, course) => sum + course.totalConcepts, 0) === 40,
      'Course progress partitions all 40 concepts'
    );
    assert(
      summary.continueLearning.length === 3 &&
        summary.continueLearning.every((item: any) => item.recommended === true),
      'Continue-learning falls back to recommended canonical concepts'
    );
    assert(
      summary.recentActivity.some((activity: any) => activity.type === 'problem') &&
        summary.recentActivity.some((activity: any) => activity.type === 'revision'),
      'Recent activity merges attempts and revision reviews'
    );

    const concept = CURRICULUM_CONCEPTS[0];
    const conceptProgress = await progressService.getConceptProgress(userId, concept.id);
    assert(
      conceptProgress.conceptId === concept.id &&
        conceptProgress.masteryState === 'UNKNOWN' &&
        conceptProgress.recommendation === 'start',
      'Concept progress returns a real recommendation for an untouched concept'
    );

    let unknownConceptRejected = false;
    try {
      await progressService.getConceptProgress(userId, 'not-a-real-concept');
    } catch (err: any) {
      unknownConceptRejected = err.message === 'Concept not found';
    }
    assert(unknownConceptRejected, 'Unknown concepts are rejected by the progress service');
  } finally {
    fs.rmSync(storePath, { force: true });
  }

  console.log(`\nVerification Complete: ${passed} / ${total} assertions passed.`);
  if (passed !== total) {
    console.error('⚠️ Durable persistence and progress tests failed.');
    process.exit(1);
  }
  console.log('🎉 All durable persistence and progress tests passed.\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
