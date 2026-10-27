/**
 * Sandboxed Code Execution Service.
 *
 * Resolves DEC-DEF-01 per SECURITY.md §7:
 * - Submitted JavaScript runs in a separate, resource-capped Node.js process
 * - The worker has no access to process, require, network, or filesystem APIs
 * - Every function invocation is bounded by a vm timeout, and the parent
 *   enforces a hard wall-clock timeout by killing the worker
 * - Only JavaScript is executable; every other language is rejected loudly
 *   instead of being silently marked as passing
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

export interface TestCase {
  input: any;
  expected_output: any;
  is_hidden?: boolean;
}

export interface TestCaseResult {
  testIndex: number;
  passed: boolean;
  input: any;
  expected: any;
  actual?: any;
  error?: string;
  executionTimeMs: number;
}

export type CodeExecutionErrorType =
  | 'unsupported_language'
  | 'invalid_input'
  | 'no_function'
  | 'execution_error'
  | 'timeout'
  | 'worker_error';

export interface CodeExecutionSummary {
  success: boolean;
  passed: number;
  total: number;
  testResults: TestCaseResult[];
  error?: string;
  errorType?: CodeExecutionErrorType;
}

const SUPPORTED_LANGUAGES = new Set(['javascript', 'js']);
const WORKER_PATH = path.resolve(__dirname, '..', '..', 'codeRunnerWorker.cjs');
const MAX_CODE_LENGTH = 50_000;
const MAX_OUTPUT_BYTES = 1_000_000;

export class UnsupportedLanguageError extends Error {
  constructor(language: string) {
    super(`Language "${language}" is not supported. Only JavaScript can be executed.`);
    this.name = 'UnsupportedLanguageError';
  }
}

function normalizeTestResults(raw: unknown, total: number): TestCaseResult[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item: any, index) => ({
      testIndex: Number.isInteger(item.testIndex) ? item.testIndex : index,
      passed: item.passed === true,
      input: item.input,
      expected: item.expected,
      actual: item.actual,
      error: typeof item.error === 'string' ? item.error.slice(0, 500) : undefined,
      executionTimeMs:
        typeof item.executionTimeMs === 'number' ? item.executionTimeMs : 0,
    }))
    .slice(0, total);
}

export class CodeRunnerService {
  /**
   * Run a student's JavaScript against a suite of test cases in an isolated
   * child process.
   */
  async runTests(
    code: string,
    language: string = 'javascript',
    testCases: TestCase[],
    timeoutMs: number = 1000
  ): Promise<CodeExecutionSummary> {
    const normalizedLanguage = (language || 'javascript').toLowerCase();
    if (!SUPPORTED_LANGUAGES.has(normalizedLanguage)) {
      throw new UnsupportedLanguageError(language);
    }

    if (typeof code !== 'string' || code.trim().length === 0) {
      return {
        success: false,
        passed: 0,
        total: testCases.length,
        testResults: [],
        error: 'Submitted code is empty.',
        errorType: 'invalid_input',
      };
    }

    if (code.length > MAX_CODE_LENGTH) {
      return {
        success: false,
        passed: 0,
        total: testCases.length,
        testResults: [],
        error: `Submitted code exceeds the ${MAX_CODE_LENGTH} character limit.`,
        errorType: 'invalid_input',
      };
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return {
        success: false,
        passed: 0,
        total: 0,
        testResults: [],
        error: 'No test cases are available for this problem.',
        errorType: 'invalid_input',
      };
    }

    const perTestTimeout = Math.min(Math.max(timeoutMs, 100), 5000);
    const hardTimeoutMs = Math.min(
      perTestTimeout * testCases.length + 3000,
      30_000
    );

    const payload = JSON.stringify({
      code,
      testCases,
      timeoutMs: perTestTimeout,
    });

    return new Promise<CodeExecutionSummary>((resolve) => {
      let stdout = '';
      let stderr = '';
      let settled = false;
      let killedByTimeout = false;
      let hardTimer: NodeJS.Timeout | undefined;

      const child = spawn(
        process.execPath,
        ['--max-old-space-size=128', '--no-warnings', WORKER_PATH],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
          env: {
            NODE_ENV: 'production',
            ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
            ...(process.env.TEMP ? { TEMP: process.env.TEMP } : {}),
          },
        }
      );

      const finish = (summary: CodeExecutionSummary) => {
        if (settled) return;
        settled = true;
        if (hardTimer) clearTimeout(hardTimer);
        resolve(summary);
      };

      hardTimer = setTimeout(() => {
        killedByTimeout = true;
        child.kill('SIGKILL');
      }, hardTimeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        if (stdout.length < MAX_OUTPUT_BYTES) stdout += chunk.toString('utf8');
      });

      child.stderr.on('data', (chunk: Buffer) => {
        if (stderr.length < 20_000) stderr += chunk.toString('utf8');
      });

      child.on('error', (err) => {
        console.error('[CodeRunner] Failed to spawn worker:', err.message);
        finish({
          success: false,
          passed: 0,
          total: testCases.length,
          testResults: [],
          error: 'Code execution is temporarily unavailable.',
          errorType: 'worker_error',
        });
      });

      child.on('close', (exitCode) => {
        if (killedByTimeout) {
          finish({
            success: false,
            passed: 0,
            total: testCases.length,
            testResults: [],
            error: `Execution exceeded the ${hardTimeoutMs}ms hard limit and was terminated.`,
            errorType: 'timeout',
          });
          return;
        }

        if (stdout.length >= MAX_OUTPUT_BYTES) {
          finish({
            success: false,
            passed: 0,
            total: testCases.length,
            testResults: [],
            error: 'Execution produced too much output.',
            errorType: 'execution_error',
          });
          return;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          console.error(
            '[CodeRunner] Worker exited without valid output. Code:',
            exitCode,
            'stderr:',
            stderr.slice(0, 2000)
          );
          finish({
            success: false,
            passed: 0,
            total: testCases.length,
            testResults: [],
            error: 'Code execution failed unexpectedly.',
            errorType: 'worker_error',
          });
          return;
        }

        if (parsed.error && !Array.isArray(parsed.testResults)) {
          finish({
            success: false,
            passed: 0,
            total: testCases.length,
            testResults: [],
            error: String(parsed.error).slice(0, 500),
            errorType: parsed.errorType || 'execution_error',
          });
          return;
        }

        const testResults = normalizeTestResults(parsed.testResults, testCases.length);
        const passed =
          typeof parsed.passed === 'number'
            ? parsed.passed
            : testResults.filter((result) => result.passed).length;

        finish({
          success: passed === testCases.length && testResults.length === testCases.length,
          passed,
          total: testCases.length,
          testResults,
        });
      });

      child.stdin.on('error', () => {
        // The worker may exit before consuming stdin; the close handler
        // reports the failure with a sanitized message.
      });

      child.stdin.end(payload);
    });
  }
}

export const codeRunner = new CodeRunnerService();
