/**
 * Automated Verification Script for Phase 5 Problem Solving & Patterns.
 *
 * Tests:
 * 1. Problems and Patterns Catalog Retrieval
 * 2. Sandboxed Code Execution with Test Cases
 * 3. Syntax and Runtime Error Handling in Sandbox
 * 4. Socratic AI Code Review for Sub-optimal O(n) vs Optimal O(log n) implementations
 * 5. Problem Submission & Hint Ladder
 */

import { problemsService } from './services/problemsService';
import { codeRunner } from './services/codeRunner';
import { getAIProvider } from './services/ai';

async function runTests() {
  console.log('=== AlgoMentor AI — Phase 5 Problem Solving Verification ===\n');

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

  // TEST 1: Retrieve Problems Catalog
  const problems = await problemsService.getProblems();
  assert(Array.isArray(problems) && problems.length >= 3, 'Problems catalog returns at least 3 seed problems');
  const binarySearchProb = problems.find((p) => p.title === 'Binary Search');
  assert(binarySearchProb !== undefined, 'Found Binary Search problem in catalog');

  // TEST 2: Retrieve Patterns Catalog
  const patterns = await problemsService.getPatterns();
  assert(Array.isArray(patterns) && patterns.length >= 3, 'Patterns catalog returns at least 3 seed patterns');
  const bsPattern = patterns.find((p) => p.name.includes('Binary Search'));
  assert(
    bsPattern !== undefined && bsPattern.recognition_signals.length > 0,
    'Pattern contains recognition signals'
  );

  // TEST 3: CodeRunner with Passing Optimal Binary Search
  const optimalCode = `
    function search(nums, target) {
      let left = 0;
      let right = nums.length - 1;
      while (left <= right) {
        let mid = Math.floor(left + (right - left) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
      }
      return -1;
    }
  `;

  const runResult = await codeRunner.runTests(optimalCode, 'javascript', binarySearchProb!.test_cases);
  assert(runResult.success === true, 'Optimal code passed all test cases');
  assert(runResult.passed === binarySearchProb!.test_cases.length, 'All test cases passed count matches total');

  // TEST 4: CodeRunner with Failing Code
  const buggyCode = `
    function search(nums, target) {
      return 0; // Wrong
    }
  `;
  const failResult = await codeRunner.runTests(buggyCode, 'javascript', binarySearchProb!.test_cases);
  assert(failResult.success === false, 'Buggy code correctly fails test suite');
  assert(failResult.passed < binarySearchProb!.test_cases.length, 'Passed count is less than total');

  // TEST 5: CodeRunner handles Syntax Error Gracefully
  const brokenCode = `
    function search(nums, target) {
      this is not valid javascript syntax @!#
    }
  `;
  const syntaxErrResult = await codeRunner.runTests(brokenCode, 'javascript', binarySearchProb!.test_cases);
  assert(syntaxErrResult.success === false, 'Syntax error caught gracefully');
  assert(syntaxErrResult.error !== undefined, 'Error message is populated on syntax error');

  // TEST 6: Socratic AI Code Review on Linear Scan (Sub-optimal)
  const linearCode = `
    function search(nums, target) {
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] === target) return i;
      }
      return -1;
    }
  `;
  const linearRun = await codeRunner.runTests(linearCode, 'javascript', binarySearchProb!.test_cases);
  const aiProvider = getAIProvider();
  const subOptimalReview = await aiProvider.reviewCode(
    {
      title: binarySearchProb!.title,
      description: binarySearchProb!.description,
      constraints: binarySearchProb!.constraints,
    },
    linearCode,
    'javascript',
    { passed: linearRun.passed, total: linearRun.total, failedTests: [] }
  );

  assert(subOptimalReview.isOptimal === false, 'Linear scan flagged as isOptimal: false');
  assert(subOptimalReview.timeComplexity === 'O(n)', 'Correctly identified O(n) time complexity penalty');
  assert(
    subOptimalReview.feedback.includes('O(n)') || subOptimalReview.feedback.includes('linear'),
    'Feedback explains linear complexity drawback'
  );

  // TEST 7: Socratic AI Code Review on Optimal Solution
  const optimalReview = await aiProvider.reviewCode(
    {
      title: binarySearchProb!.title,
      description: binarySearchProb!.description,
      constraints: binarySearchProb!.constraints,
    },
    optimalCode,
    'javascript',
    { passed: runResult.passed, total: runResult.total, failedTests: [] }
  );
  assert(optimalReview.isOptimal === true, 'Optimal binary search solution marked as isOptimal: true');
  assert(optimalReview.timeComplexity.includes('log'), 'Identified logarithmic time complexity O(log n)');

  // TEST 8: Problem Hint Ladder
  const hint1 = await problemsService.getProblemHint(binarySearchProb!.id, 1);
  const hint2 = await problemsService.getProblemHint(binarySearchProb!.id, 2);
  const hint3 = await problemsService.getProblemHint(binarySearchProb!.id, 3);
  assert(hint1.title.includes('Pattern'), 'Problem Hint 1 relates to Pattern Recognition');
  assert(hint2.title.includes('Invariant'), 'Problem Hint 2 relates to Algorithmic Invariants');
  assert(hint3.title.includes('Boundary'), 'Problem Hint 3 relates to Boundary conditions');

  console.log(`\nVerification Complete: ${passedTests} / ${totalTests} assertions passed.`);
  if (passedTests === totalTests) {
    console.log('🎉 All Phase 5 Problem Solving tests passed successfully!\n');
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
