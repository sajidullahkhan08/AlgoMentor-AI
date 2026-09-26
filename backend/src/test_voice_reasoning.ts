import { MockAIProvider } from './services/ai/mockProvider';
import { getAIProvider } from './services/ai/index';

async function runVoiceReasoningTests() {
  console.log('🎙️ === ALGORITHMIC SPOKEN REASONING TESTS (PHASE 7) ===\n');

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

  const mockProvider = new MockAIProvider();

  // Test 1: High quality spoken explanation with key invariants
  console.log('--- Test Group 1: High-Quality Verbal Transcript Evaluation ---');
  const highQualityTranscript =
    'In binary search, we maintain two pointers, left and right. At every iteration, we calculate the middle index. If target is equal to nums[mid], we return mid. If target is greater, we search the right half by setting left = mid + 1. Otherwise we set right = mid - 1. Because the search space halves every step, the time complexity is strictly O(log n).';

  const highResult = await mockProvider.evaluateSpokenReasoning(
    'Explain the logarithmic time complexity and loop invariants of Binary Search',
    highQualityTranscript,
    'Binary Search'
  );

  assert(highResult.clarityScore >= 0.8, 'High quality explanation clarity score >= 0.8', `Score: ${highResult.clarityScore}`);
  assert(highResult.accuracyScore >= 0.8, 'High quality explanation accuracy score >= 0.8', `Score: ${highResult.accuracyScore}`);
  assert(highResult.conceptualGrasps.length > 0, 'Identified conceptual grasps', `Grasps: ${highResult.conceptualGrasps.length}`);
  assert(highResult.interviewDeliveryTip.length > 0, 'Provided interview delivery tip', highResult.interviewDeliveryTip);

  // Test 2: Incomplete explanation missing termination and invariants
  console.log('\n--- Test Group 2: Weak / Incomplete Verbal Transcript Evaluation ---');
  const weakTranscript = 'Well, you just look in the middle and if not there you look again somewhere else.';

  const weakResult = await mockProvider.evaluateSpokenReasoning(
    'Explain the logarithmic time complexity and loop invariants of Binary Search',
    weakTranscript,
    'Binary Search'
  );

  assert(weakResult.accuracyScore < 0.8, 'Weak explanation has lower accuracy score', `Score: ${weakResult.accuracyScore}`);
  assert(weakResult.missingPoints.length > 0, 'Identified missing invariants / edge cases', `Missing: ${weakResult.missingPoints.length}`);
  assert(weakResult.socraticFollowUp.length > 0, 'Generated Socratic follow-up reflection', weakResult.socraticFollowUp);

  // Test 3: Active Provider Factory (Gemini or Mock fallback)
  console.log('\n--- Test Group 3: Active Provider Integration ---');
  const activeProvider = getAIProvider();
  console.log(`  Active provider: ${activeProvider.constructor.name}`);

  const activeResult = await activeProvider.evaluateSpokenReasoning(
    'How does Two Pointers achieve O(n) on a sorted array for Two Sum?',
    'We place one pointer at the start and one at the end. Since the array is sorted, if the sum is too small we advance the left pointer to increase it. If the sum is too large, we decrement the right pointer. This eliminates one element per step, guaranteeing O(n) time and O(1) space.',
    'Two Pointers'
  );

  assert(typeof activeResult.clarityScore === 'number' && activeResult.clarityScore > 0, 'Active provider returned valid clarityScore');
  assert(typeof activeResult.accuracyScore === 'number' && activeResult.accuracyScore > 0, 'Active provider returned valid accuracyScore');
  assert(Array.isArray(activeResult.conceptualGrasps), 'Active provider returned conceptual grasps array');
  assert(typeof activeResult.socraticFollowUp === 'string' && activeResult.socraticFollowUp.length > 0, 'Active provider returned Socratic follow-up');

  // Test 4: HTTP Endpoint Test
  console.log('\n--- Test Group 4: Express Endpoint POST /api/tutor/voice/evaluate ---');
  try {
    const res = await fetch('http://localhost:3000/api/tutor/voice/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Why does BFS guarantee the shortest path in unweighted graphs?',
        transcript: 'BFS explores nodes level by level using a queue (FIFO). Because all edges have uniform weight 1, any node discovered at level k is at the minimum distance k from source.',
        topicOrProblem: 'Breadth-First Search',
      }),
    });

    const data = await res.json() as any;
    assert(res.status === 200, 'HTTP 200 returned from /api/tutor/voice/evaluate', `Status: ${res.status}`);
    assert(typeof data.clarityScore === 'number', 'Response contains review with clarityScore');
    assert(Array.isArray(data.conceptualGrasps) && data.conceptualGrasps.length > 0, 'Review includes conceptual grasps');
    assert(typeof data.interviewDeliveryTip === 'string', 'Review contains interviewDeliveryTip');
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

runVoiceReasoningTests();
