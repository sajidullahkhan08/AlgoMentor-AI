/**
 * Automated verification for the hardened code execution sandbox.
 *
 * Covers: correct/wrong output, syntax errors, per-test timeouts,
 * blocked Node globals, blocked eval, missing functions, oversized code,
 * and rejection of non-JavaScript languages.
 */

import { codeRunner, UnsupportedLanguageError } from './services/codeRunner';

const binarySearchCases = [
  { input: [[-1, 0, 3, 5, 9, 12], 9], expected_output: 4 },
  { input: [[-1, 0, 3, 5, 9, 12], 2], expected_output: -1 },
];

async function main() {
  console.log('=== AlgoMentor AI — Code Execution Security Verification ===\n');

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

  const optimal = await codeRunner.runTests(
    `function search(nums, target) {
      let left = 0, right = nums.length - 1;
      while (left <= right) {
        const mid = Math.floor(left + (right - left) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
      }
      return -1;
    }`,
    'javascript',
    binarySearchCases
  );
  assert(optimal.success === true && optimal.passed === 2, 'Valid solution passes every test');

  const wrong = await codeRunner.runTests(
    'function search() { return 0; }',
    'js',
    binarySearchCases
  );
  assert(wrong.success === false && wrong.passed === 0, 'Wrong output fails without crashing the runner');

  const syntaxError = await codeRunner.runTests(
    'function search( { this is not valid @@@ }',
    'javascript',
    binarySearchCases
  );
  assert(
    syntaxError.success === false && Boolean(syntaxError.error),
    'Syntax errors return a structured error'
  );

  const infiniteLoop = await codeRunner.runTests(
    'function search() { while (true) {} }',
    'javascript',
    binarySearchCases,
    200
  );
  assert(
    infiniteLoop.success === false &&
      infiniteLoop.testResults.some((result) => /timed out/i.test(result.error || '')),
    'Infinite loop inside the submitted function is stopped by the vm timeout'
  );

  const topLevelLoop = await codeRunner.runTests(
    'while (true) {}',
    'javascript',
    binarySearchCases,
    200
  );
  assert(
    topLevelLoop.success === false && /timed out/i.test(topLevelLoop.error || ''),
    'Infinite loop during initial evaluation is stopped'
  );

  const blockedGlobals = await codeRunner.runTests(
    'function search() { return [typeof require, typeof process, typeof module].join(":"); }',
    'javascript',
    [{ input: [], expected_output: 'undefined:undefined:undefined' }]
  );
  assert(blockedGlobals.success === true, 'require/process/module are unavailable inside the sandbox');

  const blockedEval = await codeRunner.runTests(
    'function search() { return eval("2 + 2"); }',
    'javascript',
    [{ input: [], expected_output: 4 }]
  );
  assert(
    blockedEval.success === false &&
      /code generation/i.test(blockedEval.testResults[0]?.error || ''),
    'Dynamic eval is blocked inside the sandbox'
  );

  const noFunction = await codeRunner.runTests('const answer = 42;', 'javascript', binarySearchCases);
  assert(noFunction.errorType === 'no_function', 'Code without an executable function is rejected');

  const emptyCode = await codeRunner.runTests('   ', 'javascript', binarySearchCases);
  assert(emptyCode.errorType === 'invalid_input', 'Empty submissions are rejected');

  const oversizedCode = await codeRunner.runTests(
    `function search() {}\n// ${'x'.repeat(50_000)}`,
    'javascript',
    binarySearchCases
  );
  assert(oversizedCode.errorType === 'invalid_input', 'Oversized submissions are rejected before execution');

  try {
    await codeRunner.runTests('def search(nums, target): pass', 'python', binarySearchCases);
    assert(false, 'Non-JavaScript languages are rejected');
  } catch (err) {
    assert(err instanceof UnsupportedLanguageError, 'Non-JavaScript languages are rejected');
  }

  console.log(`\nVerification Complete: ${passed} / ${total} assertions passed.`);
  if (passed !== total) {
    console.error('⚠️ Code execution security tests failed.');
    process.exit(1);
  }
  console.log('🎉 All code execution security tests passed.\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
