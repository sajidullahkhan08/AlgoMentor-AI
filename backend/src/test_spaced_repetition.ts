import { revisionService } from './services/revisionService';

async function runSpacedRepetitionTests() {
  console.log('🔁 === ALGORITHMIC SPACED REPETITION & LEITNER TESTS (PHASE 8) ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // Test Group 1: SM-2 Mathematical Formulation
  console.log('--- Test Group 1: SuperMemo SM-2 Mathematical Progression ---');
  // First successful recall
  const r1 = revisionService.calculateSM2(5, 0, 1, 2.5);
  assert(r1.repetitions === 1, 'First successful recall sets repetitions = 1');
  assert(r1.intervalDays === 1, 'First successful recall sets interval = 1 day');
  assert(r1.easinessFactor >= 2.5, 'Rating 5 increases or maintains EF', `EF: ${r1.easinessFactor}`);
  assert(r1.leitnerBox === 1, 'Repetition 1 remains in Leitner Box 1');

  // Second successful recall
  const r2 = revisionService.calculateSM2(4, r1.repetitions, r1.intervalDays, r1.easinessFactor);
  assert(r2.repetitions === 2, 'Second recall sets repetitions = 2');
  assert(r2.intervalDays === 6, 'Second recall expands interval to 6 days');
  assert(r2.leitnerBox === 2, 'Two repetitions promotes to Leitner Box 2');

  // Third successful recall
  const r3 = revisionService.calculateSM2(5, r2.repetitions, r2.intervalDays, r2.easinessFactor);
  assert(r3.repetitions === 3, 'Third recall sets repetitions = 3');
  assert(r3.intervalDays >= 14, 'Third recall multiplies interval by EF (>= 14 days)', `Interval: ${r3.intervalDays}`);

  // Test Group 2: Failure Reset & Overconfidence Penalty
  console.log('\n--- Test Group 2: Retrieval Failure & Calibration Penalty ---');
  const failNormal = revisionService.calculateSM2(1, 3, 15, 2.6);
  assert(failNormal.repetitions === 0, 'Failed retrieval resets repetitions to 0');
  assert(failNormal.intervalDays === 1, 'Failed retrieval resets interval to 1 day');
  assert(failNormal.leitnerBox === 1, 'Failed retrieval resets item to Leitner Box 1');

  const failOverconfident = revisionService.calculateSM2(1, 3, 15, 2.6, 'overconfident');
  assert(
    failOverconfident.easinessFactor < failNormal.easinessFactor,
    'Overconfident failure incurs steeper EF penalty',
    `Normal EF: ${failNormal.easinessFactor} vs Overconfident: ${failOverconfident.easinessFactor}`
  );

  // Test Group 3: Service Queue & Stats
  console.log('\n--- Test Group 3: Revision Service Queue & Retrieval ---');
  const testUser = 'test-user-phase8';
  const queue = await revisionService.getDueQueue(testUser);
  assert(Array.isArray(queue.dueItems) && queue.dueItems.length > 0, 'Due queue returns seeded algorithmic invariants');
  assert(queue.dueItems[0].key_invariant.length > 0, 'Item contains explicit key algorithmic invariant');

  const statsInitial = await revisionService.getStats(testUser);
  assert(statsInitial.totalItems >= 4, 'Stats show at least 4 total tracked invariants');
  assert(statsInitial.retentionRatePercent > 0, 'Calculates retention rate percentage');

  // Review an item and verify advancement
  const itemToReview = queue.dueItems[0];
  const reviewResult = await revisionService.reviewItem(testUser, itemToReview.id, 5, 'confident', 15);
  assert(reviewResult.newBox >= reviewResult.previousBox, 'Successful rating advances or holds Leitner box');
  assert(reviewResult.intervalDays >= 1, 'Updated interval is positive');

  // Test Group 4: Express HTTP Endpoints
  console.log('\n--- Test Group 4: Express HTTP Endpoints ---');
  try {
    const queueRes = await fetch('http://localhost:3000/api/revision/queue');
    const queueData = await queueRes.json() as any;
    assert(queueRes.status === 200, 'GET /api/revision/queue returns HTTP 200');
    assert(Array.isArray(queueData.dueItems), 'Response has dueItems array');

    const reviewRes = await fetch('http://localhost:3000/api/revision/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: queueData.dueItems[0]?.id || 'a1000000-0000-0000-0000-000000000001',
        rating: 4,
        confidence: 'confident',
        timeSpentSeconds: 20,
      }),
    });
    const reviewData = await reviewRes.json() as any;
    assert(reviewRes.status === 200, 'POST /api/revision/review returns HTTP 200');
    assert(typeof reviewData.newBox === 'number', 'Review response includes newBox');

    const statsRes = await fetch('http://localhost:3000/api/revision/stats');
    const statsData = await statsRes.json() as any;
    assert(statsRes.status === 200, 'GET /api/revision/stats returns HTTP 200');
    assert(typeof statsData.retentionRatePercent === 'number', 'Stats includes retentionRatePercent');
  } catch (err: any) {
    console.error('  Failed to call HTTP endpoint:', err.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSpacedRepetitionTests();
