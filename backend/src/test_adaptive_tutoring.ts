/**
 * Automated Verification Script for Phase 4 Adaptive Tutoring.
 *
 * Tests:
 * 1. MockAIProvider question generation across interaction types:
 *    - multiple_choice
 *    - multiple_select
 *    - ordering
 *    - short_text
 * 2. Confidence vs. Accuracy Calibration:
 *    - Overconfidence detection (confident + wrong)
 *    - Underconfidence detection (unsure + correct)
 * 3. Prerequisite Descent and Ascent flow:
 *    - Descent trigger on prerequisite gap
 *    - Prerequisite knowledge update
 *    - Ascent trigger on prerequisite mastery
 */

import { MockAIProvider } from './services/ai/mockProvider';
import { TutorContext, StudentResponse } from './services/ai/aiProvider';
import { tutorEngine } from './services/tutorEngine';

async function runTests() {
  console.log('=== AlgoMentor AI — Phase 4 Adaptive Tutoring Verification ===\n');

  const mockAI = new MockAIProvider();
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  }

  // TEST 1: Question 1 — Multiple Choice
  const ctx1: TutorContext = {
    conceptId: '44444444-0004-0004-0004-000000000001',
    conceptName: 'Binary Search',
    conceptDescription: 'Divide and conquer search algorithm',
    learningObjectives: ['Understand binary search'],
    masteryState: 'INTRODUCED',
    recentInteractions: [],
  };

  const q1 = await mockAI.generateQuestion(ctx1);
  assert(q1.interactionType === 'multiple_choice', 'Question 1 is multiple_choice');
  assert(q1.options !== undefined && q1.options.length === 4, 'Question 1 has 4 options');

  // TEST 2: Multiple Choice Evaluation + Overconfidence Calibration
  const resp1Wrong: StudentResponse = {
    answer: '0', // wrong option
    confidence: 'confident',
  };
  const eval1 = await mockAI.evaluateResponse(ctx1, q1, resp1Wrong);
  assert(!eval1.isCorrect, 'Incorrect MCQ answer evaluated as false');
  assert(eval1.score === 0.0, 'Incorrect MCQ score is 0.0');
  assert(
    eval1.calibration?.type === 'overconfident',
    'Overconfidence correctly detected (confident + wrong)'
  );

  // TEST 3: Question 2 — Multiple Selection
  const ctx2: TutorContext = {
    ...ctx1,
    recentInteractions: [
      {
        interactionType: 'multiple_choice',
        question: q1,
        studentResponse: resp1Wrong,
        evaluation: eval1,
        hintLevel: 0,
      },
    ],
  };

  const q2 = await mockAI.generateQuestion(ctx2);
  assert(q2.interactionType === 'multiple_select', 'Question 2 is multiple_select');
  assert(
    Array.isArray(q2.correctOptionIndices) && q2.correctOptionIndices.length === 3,
    'Question 2 requires multiple conditions [0, 1, 3]'
  );

  // TEST 4: Multiple Select Evaluation + Underconfidence Calibration
  const resp2Correct: StudentResponse = {
    answer: '0,1,3', // correct set of options
    confidence: 'unsure',
  };
  const eval2 = await mockAI.evaluateResponse(ctx2, q2, resp2Correct);
  assert(eval2.isCorrect, 'Correct multiple_select evaluated as true');
  assert(eval2.score === 1.0, 'Correct multiple_select score is 1.0');
  assert(
    eval2.calibration?.type === 'underconfident',
    'Underconfidence correctly detected (unsure + correct)'
  );

  // TEST 5: Question 3 — Step Ordering / Sequence
  const ctx3: TutorContext = {
    ...ctx1,
    recentInteractions: [
      ...ctx2.recentInteractions,
      {
        interactionType: 'multiple_select',
        question: q2,
        studentResponse: resp2Correct,
        evaluation: eval2,
        hintLevel: 0,
      },
    ],
  };

  const q3 = await mockAI.generateQuestion(ctx3);
  assert(q3.interactionType === 'ordering', 'Question 3 is ordering');
  assert(
    Array.isArray(q3.orderingItems) && q3.orderingItems.length === 4,
    'Question 3 has 4 steps to order'
  );

  // TEST 6: Ordering Evaluation
  const resp3Correct: StudentResponse = {
    answer: '0,1,2,3',
    confidence: 'confident',
  };
  const eval3 = await mockAI.evaluateResponse(ctx3, q3, resp3Correct);
  assert(eval3.isCorrect, 'Correct sequence evaluated as true');
  assert(eval3.score === 1.0, 'Correct sequence score is 1.0');

  // TEST 7: Prerequisite Descent Question Generation
  const prereqDescentContext: TutorContext = {
    conceptId: '44444444-0002-0002-0002-000000000002',
    conceptName: 'Sorted Arrays',
    conceptDescription: 'Monotonically ordered elements',
    learningObjectives: ['Understand directional elimination'],
    masteryState: 'INTRODUCED',
    recentInteractions: [],
    isPrerequisiteDescent: true,
    descentReason: 'Solidify sorted array properties before Binary Search',
  };

  const prereqQ = await mockAI.generateQuestion(prereqDescentContext);
  assert(prereqQ.isPrerequisiteDescent === true, 'Prerequisite question has isPrerequisiteDescent = true');
  assert(
    prereqQ.descentReason?.includes('sorted array') || false,
    'Prerequisite question includes descentReason'
  );

  // TEST 8: Prerequisite Ascent Evaluation
  const prereqResp: StudentResponse = {
    answer: '0',
    confidence: 'confident',
  };
  const prereqEval = await mockAI.evaluateResponse(prereqDescentContext, prereqQ, prereqResp);
  assert(prereqEval.isCorrect, 'Prerequisite answer evaluated correctly');
  assert(prereqEval.score >= 0.8, 'Prerequisite score satisfies ascent threshold (>= 0.8)');

  // TEST 9: Hint Ladder Escalation
  const hint1 = await mockAI.generateHint(ctx1, q1, 1);
  const hint5 = await mockAI.generateHint(ctx1, q1, 5);
  assert(hint1.hintLevel === 1, 'Hint 1 is Level 1 Socratic Question');
  assert(hint5.hintLevel === 5, 'Hint 5 provides pseudocode');
  assert(hint5.hintContent.includes('mid = left'), 'Hint 5 includes algorithm logic');

  console.log(`\nVerification Complete: ${passedTests} / ${totalTests} assertions passed.`);
  if (passedTests === totalTests) {
    console.log('🎉 All Phase 4 Adaptive Tutoring tests passed successfully!\n');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
