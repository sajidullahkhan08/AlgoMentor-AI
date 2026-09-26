import { systemDesignService } from './services/systemDesignService';

async function runSystemDesignTests() {
  console.log('🏛️ === ALGORITHMIC SYSTEM DESIGN & DISTRIBUTED SCALE TESTS (PHASE 9) ===\n');

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

  // Test Group 1: Scenarios Catalog & Scale Metrics
  console.log('--- Test Group 1: System Design Scenarios & Scale Metrics ---');
  const scenarios = await systemDesignService.getScenarios();
  assert(Array.isArray(scenarios) && scenarios.length >= 3, 'Scenarios catalog returns at least 3 production designs', `Count: ${scenarios.length}`);

  const urlShortener = await systemDesignService.getScenario('url-shortener');
  assert(urlShortener !== null, 'Found TinyURL scenario by slug');
  assert(Boolean(urlShortener?.scale_metrics.read_qps), 'Includes back-of-the-envelope read QPS estimation');
  assert(Boolean(urlShortener && urlShortener.functional_requirements.length >= 3), 'Includes functional requirements');
  assert(Boolean(urlShortener && urlShortener.trade_off_questions.length >= 2), 'Includes critical engineering trade-off questions');

  const chatSystem = await systemDesignService.getScenario('realtime-chat');
  assert(chatSystem !== null, 'Found Real-Time Chat scenario');
  assert(Boolean(chatSystem && chatSystem.architecture_components.some((c) => c.id.includes('ws') || c.id.includes('broker'))), 'Includes WebSocket/broker components');

  // Test Group 2: Socratic Architecture Evaluation (Sound Architecture)
  console.log('\n--- Test Group 2: Sound Architecture Evaluation ---');
  const soundEval = await systemDesignService.evaluateDesign(
    'url-shortener',
    ['dns_lb', 'api_gateway', 'app_cluster', 'keygen_service', 'cache_tier', 'db_cluster'],
    'We employ DNS Anycast load balancing to distribute global traffic, stateless app servers for Base62 encoding, Redis LRU cache to handle 80% read QPS in RAM, and a horizontally partitioned Cassandra cluster using consistent hashing with masterless replication.'
  );

  assert(soundEval.score >= 80, 'Sound architecture achieves high scalability score (>= 80)', `Score: ${soundEval.score}`);
  assert(soundEval.isArchitecturallySound === true, 'Flagged as architecturally sound');
  assert(soundEval.strengths.length >= 2, 'Identified architectural strengths', `Strengths: ${soundEval.strengths.length}`);
  assert(soundEval.socraticChallenge.length > 0, 'Generated Socratic failure mode challenge', soundEval.socraticChallenge);

  // Test Group 3: Flawed Architecture (Missing Caching and Load Balancing)
  console.log('\n--- Test Group 3: Flawed / Incomplete Architecture Evaluation ---');
  const flawedEval = await systemDesignService.evaluateDesign(
    'url-shortener',
    ['app_cluster', 'db_cluster'],
    'Just direct connections to the app server and standard database.'
  );

  assert(flawedEval.score < 75, 'Flawed architecture receives lower score (< 75)', `Score: ${flawedEval.score}`);
  assert(flawedEval.bottlenecksIdentified.length > 0, 'Detected missing caching/LB bottlenecks');
  assert(flawedEval.singlePointsOfFailure.length > 0, 'Identified Single Points of Failure (SPOF)');

  // Test Group 4: Express HTTP Endpoints
  console.log('\n--- Test Group 4: Express HTTP Endpoints ---');
  try {
    const listRes = await fetch('http://localhost:3000/api/system-design/scenarios');
    const listData = await listRes.json() as any;
    assert(listRes.status === 200, 'GET /api/system-design/scenarios returns HTTP 200');
    assert(Array.isArray(listData) && listData.length >= 3, 'Returned scenario array');

    const detailRes = await fetch('http://localhost:3000/api/system-design/scenarios/url-shortener');
    const detailData = await detailRes.json() as any;
    assert(detailRes.status === 200, 'GET /api/system-design/scenarios/:id returns HTTP 200');
    assert(detailData.slug === 'url-shortener', 'Detail payload matches requested slug');

    const evalRes = await fetch('http://localhost:3000/api/system-design/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: 'url-shortener',
        selectedComponentIds: ['dns_lb', 'api_gateway', 'cache_tier', 'db_cluster'],
        userExplanation: 'Using Redis cache for hot URLs and Cassandra for sharded persistence.',
      }),
    });
    const evalData = await evalRes.json() as any;
    assert(evalRes.status === 200, 'POST /api/system-design/evaluate returns HTTP 200');
    assert(typeof evalData.score === 'number', 'Evaluation response contains score');
    assert(typeof evalData.socraticChallenge === 'string', 'Evaluation response contains socraticChallenge');
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

runSystemDesignTests();
