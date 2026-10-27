'use strict';

/**
 * Isolated code execution worker.
 *
 * Spawned as a separate Node.js process by CodeRunnerService with a capped
 * old-space size. Reads one JSON payload from stdin, evaluates the submitted
 * JavaScript inside a vm context, and prints one JSON result to stdout.
 *
 * Defense in depth (not a hard security boundary):
 * - no process/require/import/network/fs access exposed to the sandbox
 * - eval/Function constructor disabled via codeGeneration.strings = false
 * - per-test vm timeout (covers the function invocation itself)
 * - parent enforces a hard wall-clock timeout and kills the process
 *
 * This file stays at the backend root so the same path resolves from both
 * src/services (tsx dev) and dist/services (compiled build).
 */

const vm = require('node:vm');

const MAX_RESULT_CHARS = 10000;

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', reject);
  });
}

function areEqual(a, b) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function sanitizeForOutput(value) {
  try {
    const json = JSON.stringify(value);
    if (json === undefined) return null;
    if (json.length > MAX_RESULT_CHARS) {
      return `${json.slice(0, MAX_RESULT_CHARS)}...[truncated]`;
    }
    return value;
  } catch {
    return '[unserializable result]';
  }
}

function sanitizeMessage(err) {
  const raw = err && typeof err.message === 'string' ? err.message : 'Execution error';
  return raw.split('\n')[0].slice(0, 300);
}

function detectFunctionName(code) {
  const fnMatch =
    code.match(/function\s+([a-zA-Z0-9_$]+)/) ||
    code.match(
      /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|(?:async\s*)?\([^)]*\)\s*=>|[a-zA-Z0-9_$]+\s*=>)/
    );
  return fnMatch && fnMatch[1] ? fnMatch[1] : '';
}

function run(payload) {
  const { code, testCases, timeoutMs } = payload;

  if (typeof code !== 'string' || code.trim().length === 0) {
    return { errorType: 'invalid_input', error: 'Submitted code is empty.' };
  }
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return { errorType: 'invalid_input', error: 'No test cases were provided.' };
  }

  const sandbox = {
    Math,
    Number,
    String,
    Array,
    Object,
    Boolean,
    JSON,
    Map,
    Set,
    Date,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    console: { log() {}, warn() {}, error() {}, info() {}, debug() {} },
  };

  const context = vm.createContext(sandbox, {
    codeGeneration: { strings: false, wasm: false },
    microtaskMode: 'afterEvaluate',
  });

  const initialKeys = new Set(Object.keys(sandbox));
  let targetFunctionName = detectFunctionName(code);

  try {
    vm.runInContext(code, context, { timeout: timeoutMs, breakOnSigint: true });
  } catch (err) {
    return {
      errorType: 'execution_error',
      error: `Syntax or evaluation error: ${sanitizeMessage(err)}`,
    };
  }

  if (!targetFunctionName || typeof context[targetFunctionName] !== 'function') {
    const addedKeys = Object.keys(context).filter(
      (key) => !initialKeys.has(key) && typeof context[key] === 'function'
    );
    if (addedKeys.length > 0) {
      targetFunctionName = addedKeys[0];
    } else {
      return {
        errorType: 'no_function',
        error: 'No executable function found in submitted code.',
      };
    }
  }

  const testResults = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i += 1) {
    const testCase = testCases[i];
    const start = Date.now();

    try {
      const args = Array.isArray(testCase.input) ? testCase.input : [testCase.input];
      const clonedArgs = JSON.parse(JSON.stringify(args));

      sandbox.__algomentorArgs = clonedArgs;
      sandbox.__algomentorFn = context[targetFunctionName];

      const actualOutput = vm.runInContext(
        '__algomentorFn.apply(null, __algomentorArgs)',
        context,
        { timeout: timeoutMs, breakOnSigint: true }
      );

      delete sandbox.__algomentorArgs;
      delete sandbox.__algomentorFn;
      delete context.__algomentorArgs;
      delete context.__algomentorFn;

      const passed = areEqual(actualOutput, testCase.expected_output);
      if (passed) passedCount += 1;

      testResults.push({
        testIndex: i,
        passed,
        input: testCase.input,
        expected: testCase.expected_output,
        actual: sanitizeForOutput(actualOutput),
        executionTimeMs: Math.max(1, Date.now() - start),
      });
    } catch (err) {
      const timedOut =
        err && (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || err.name === 'TimeoutError');
      testResults.push({
        testIndex: i,
        passed: false,
        input: testCase.input,
        expected: testCase.expected_output,
        error: timedOut
          ? `Execution timed out after ${timeoutMs}ms.`
          : sanitizeMessage(err),
        executionTimeMs: Math.max(1, Date.now() - start),
      });

      // A timeout or crashed invocation means the sandbox is in an unknown
      // state. Stop executing further cases rather than risking a hang.
      if (timedOut) break;
    }
  }

  return {
    passed: passedCount,
    total: testCases.length,
    testResults,
  };
}

async function main() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    process.stdout.write(JSON.stringify({ errorType: 'invalid_input', error: 'Invalid payload.' }));
    return;
  }

  let result;
  try {
    result = run(payload);
  } catch (err) {
    result = {
      errorType: 'execution_error',
      error: `Sandbox failure: ${sanitizeMessage(err)}`,
    };
  }

  process.stdout.write(JSON.stringify(result));
}

main();
