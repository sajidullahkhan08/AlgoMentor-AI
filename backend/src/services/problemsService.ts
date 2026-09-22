/**
 * Problems and Patterns Service.
 *
 * Implements Phase 5 Problem Solving orchestration:
 * - Problem and Pattern catalog browsing
 * - Safe test execution via CodeRunner
 * - Socratic AI Code Review via AIProvider (Gemini / Mock)
 * - Persistent attempt recording and misconception tracking
 */

import { getSupabase } from '../config/supabase';
import { getAIProvider } from './ai';
import { codeRunner, CodeExecutionSummary } from './codeRunner';

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  pattern_id?: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starter_code: Record<string, string>;
  test_cases: Array<{ input: any; expected_output: any; is_hidden?: boolean }>;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  recognition_signals: string[];
  common_mistakes: string[];
  sort_order: number;
}

// Built-in seed data used for fallback and immediate testing
const SEED_PATTERNS: Pattern[] = [
  {
    id: '55555555-0001-0001-0001-000000000001',
    name: 'Binary Search On Sorted Array',
    description:
      'Locating a target value or boundary condition in a sorted collection by iteratively halving the search space.',
    difficulty: 'beginner',
    recognition_signals: [
      'Input is an array or monotonic function',
      'Goal asks for target position or insertion point with O(log n) time',
      'Directional elimination holds: if target is less than mid, everything right is excluded',
    ],
    common_mistakes: [
      'Integer overflow in mid calculation: using (left + right) / 2 instead of left + (right - left) / 2',
      'Off-by-one boundary adjustment: assigning right = mid instead of mid - 1 in closed intervals',
      'Incorrect loop termination: left < right vs left <= right causing missed single-element targets',
    ],
    sort_order: 1,
  },
  {
    id: '55555555-0001-0001-0001-000000000002',
    name: 'Search Space Reduction / Binary Search On Answer',
    description:
      'Applying binary search over a discrete range of feasible answers rather than an input array index.',
    difficulty: 'intermediate',
    recognition_signals: [
      'Solution seeks min/max value satisfying a monotonic predicate',
      'Feasibility condition is monotonic: if k works, all k\' > k (or k\' < k) also work',
      'Easy to verify an answer in O(n), but hard to compute directly',
    ],
    common_mistakes: [
      'Failing to verify monotonic behavior of feasibility check',
      'Incorrect search range initialization (left = 0 vs min element)',
      'Infinite loop when right = mid or left = mid without proper rounding',
    ],
    sort_order: 2,
  },
  {
    id: '55555555-0001-0001-0001-000000000003',
    name: 'Two Pointers',
    description:
      'Coordinating two indices moving across an array to find pairs, partitions, or intervals in linear time.',
    difficulty: 'beginner',
    recognition_signals: [
      'Sorted array asking for pairs with a target sum or difference',
      'In-place array element partitioning or reversal',
      'Palindrome verification or string matching',
    ],
    common_mistakes: [
      'Incrementing both pointers simultaneously when only one should advance',
      'Index out of bounds when pointers cross',
      'Attempting on unsorted data where monotonicity does not hold',
    ],
    sort_order: 3,
  },
];

const SEED_PROBLEMS: Problem[] = [
  {
    id: '66666666-0001-0001-0001-000000000001',
    title: 'Binary Search',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    difficulty: 'easy',
    category: 'Searching',
    pattern_id: '55555555-0001-0001-0001-000000000001',
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'All the integers in nums are unique.',
      'nums is sorted in ascending order.',
    ],
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4',
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1',
      },
    ],
    starter_code: {
      javascript: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    let mid = Math.floor(left + (right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}`,
      python: `def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    },
    test_cases: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], expected_output: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], expected_output: -1 },
      { input: [[5], 5], expected_output: 0 },
      { input: [[5], -5], expected_output: -1 },
      { input: [[1, 3, 5, 7, 9, 11, 13, 15], 1], expected_output: 0 },
      { input: [[1, 3, 5, 7, 9, 11, 13, 15], 15], expected_output: 7 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000002',
    title: 'Search a 2D Matrix',
    description: `You are given an \`m x n\` integer matrix \`matrix\` with the following two properties:
1. Each row is sorted in non-decreasing order.
2. The first integer of each row is greater than the last integer of the previous row.

Given an integer \`target\`, return \`true\` if \`target\` is in \`matrix\` or \`false\` otherwise.

You must write a solution in \`O(log(m * n))\` time complexity.`,
    difficulty: 'medium',
    category: 'Searching',
    pattern_id: '55555555-0001-0001-0001-000000000001',
    constraints: [
      'm == matrix.length',
      'n == matrix[i].length',
      '1 <= m, n <= 100',
      '-10^4 <= matrix[i][j], target <= 10^4',
    ],
    examples: [
      {
        input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3',
        output: 'true',
      },
      {
        input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13',
        output: 'false',
      },
    ],
    starter_code: {
      javascript: `function searchMatrix(matrix, target) {
  const m = matrix.length;
  const n = matrix[0].length;
  let left = 0;
  let right = m * n - 1;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    const row = Math.floor(mid / n);
    const col = mid % n;
    const val = matrix[row][col];

    if (val === target) return true;
    if (val < target) left = mid + 1;
    else right = mid - 1;
  }

  return false;
}`,
      python: `def searchMatrix(matrix: list[list[int]], target: int) -> bool:
    m, n = len(matrix), len(matrix[0])
    left, right = 0, m * n - 1
    while left <= right:
        mid = left + (right - left) // 2
        val = matrix[mid // n][mid % n]
        if val == target:
            return True
        elif val < target:
            left = mid + 1
        else:
            right = mid - 1
    return False`,
    },
    test_cases: [
      {
        input: [
          [
            [1, 3, 5, 7],
            [10, 11, 16, 20],
            [23, 30, 34, 60],
          ],
          3,
        ],
        expected_output: true,
      },
      {
        input: [
          [
            [1, 3, 5, 7],
            [10, 11, 16, 20],
            [23, 30, 34, 60],
          ],
          13,
        ],
        expected_output: false,
      },
      { input: [[[1]], 1], expected_output: true },
      { input: [[[1]], 0], expected_output: false },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000003',
    title: 'Find Minimum in Rotated Sorted Array',
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times.

Given the sorted rotated array \`nums\` of unique elements, return the minimum element of this array.

You must write an algorithm that runs in \`O(log n)\` time.`,
    difficulty: 'medium',
    category: 'Searching',
    pattern_id: '55555555-0001-0001-0001-000000000002',
    constraints: [
      'n == nums.length',
      '1 <= n <= 5000',
      '-5000 <= nums[i] <= 5000',
      'All the integers of nums are unique.',
      'nums is sorted and rotated between 1 and n times.',
    ],
    examples: [
      {
        input: 'nums = [3,4,5,1,2]',
        output: '1',
        explanation: 'The original array was [1,2,3,4,5] rotated 3 times.',
      },
      {
        input: 'nums = [4,5,6,7,0,1,2]',
        output: '0',
        explanation: 'The original array was [0,1,2,4,5,6,7] and it was rotated 4 times.',
      },
    ],
    starter_code: {
      javascript: `function findMin(nums) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const mid = Math.floor(left + (right - left) / 2);
    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return nums[left];
}`,
      python: `def findMin(nums: list[int]) -> int:
    left, right = 0, len(nums) - 1
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] > nums[right]:
            left = mid + 1
        else:
            right = mid
    return nums[left]`,
    },
    test_cases: [
      { input: [[3, 4, 5, 1, 2]], expected_output: 1 },
      { input: [[4, 5, 6, 7, 0, 1, 2]], expected_output: 0 },
      { input: [[11, 13, 15, 17]], expected_output: 11 },
      { input: [[1]], expected_output: 1 },
      { input: [[2, 1]], expected_output: 1 },
    ],
  },
];

export class ProblemsService {
  private get supabase() {
    return getSupabase();
  }

  private get ai() {
    return getAIProvider();
  }

  /**
   * List problems with optional filtering.
   */
  async getProblems(filters?: { difficulty?: string; category?: string; patternId?: string }): Promise<Problem[]> {
    try {
      let query = this.supabase
        .from('problems')
        .select('id, title, description, difficulty, category, pattern_id, constraints, examples, starter_code, test_cases, sort_order')
        .order('sort_order', { ascending: true });

      if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.patternId) query = query.eq('pattern_id', filters.patternId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Problem[];
      }
    } catch {
      // Gracefully fall back to seed data if database table not yet populated
    }

    // Apply in-memory filters on seed dataset
    return SEED_PROBLEMS.filter((p) => {
      if (filters?.difficulty && p.difficulty !== filters.difficulty) return false;
      if (filters?.category && p.category !== filters.category) return false;
      if (filters?.patternId && p.pattern_id !== filters.patternId) return false;
      return true;
    });
  }

  /**
   * Get single problem by ID.
   */
  async getProblemById(id: string): Promise<Problem | null> {
    try {
      const { data, error } = await this.supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) return data as Problem;
    } catch {
      // Fallback
    }

    return SEED_PROBLEMS.find((p) => p.id === id) || null;
  }

  /**
   * List all DSA Patterns with recognition signals and common mistakes.
   */
  async getPatterns(): Promise<Pattern[]> {
    try {
      const { data, error } = await this.supabase
        .from('patterns')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) return data as Pattern[];
    } catch {
      // Fallback
    }

    return SEED_PATTERNS;
  }

  /**
   * Run code against sample test cases (non-evaluative test run).
   */
  async runCode(problemId: string, code: string, language: string = 'javascript'): Promise<CodeExecutionSummary> {
    const problem = await this.getProblemById(problemId);
    if (!problem) throw new Error('Problem not found');

    return codeRunner.runTests(code, language, problem.test_cases.slice(0, 2));
  }

  /**
   * Submit code for full evaluation, automated test run, Socratic AI review, and persistence.
   */
  async submitCode(
    userId: string,
    problemId: string,
    code: string,
    language: string = 'javascript',
    hintsUsed: number = 0
  ) {
    const problem = await this.getProblemById(problemId);
    if (!problem) throw new Error('Problem not found');

    // 1. Run full test suite in isolated sandbox
    const testExecution = await codeRunner.runTests(code, language, problem.test_cases);

    // 2. Perform Socratic AI Code Review
    const failedTests = testExecution.testResults.filter((t) => !t.passed);
    const aiReview = await this.ai.reviewCode(
      {
        title: problem.title,
        description: problem.description,
        constraints: problem.constraints,
      },
      code,
      language,
      {
        passed: testExecution.passed,
        total: testExecution.total,
        failedTests,
      }
    );

    const status = testExecution.success
      ? hintsUsed === 0
        ? 'solved_independently'
        : 'passed'
      : 'failed';

    // 3. Persist attempt if table exists
    let attemptId = null;
    try {
      const { data: attempt } = await this.supabase
        .from('problem_attempts')
        .insert({
          user_id: userId,
          problem_id: problemId,
          code,
          language,
          status,
          test_results: testExecution.testResults,
          ai_feedback: aiReview,
          hints_used: hintsUsed,
        })
        .select('id')
        .single();

      if (attempt) attemptId = attempt.id;
    } catch {
      // Silent catch for attempt logging
    }

    // 4. Record detected misconceptions for cross-session adaptation
    if (aiReview.detectedIssues && aiReview.detectedIssues.length > 0) {
      try {
        for (const issue of aiReview.detectedIssues) {
          await this.supabase.from('student_misconceptions').upsert(
            {
              user_id: userId,
              misconception_tag: issue.substring(0, 50),
              description: issue,
              last_detected_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,misconception_tag' }
          );
        }
      } catch {
        // Silent catch
      }
    }

    return {
      success: testExecution.success,
      status,
      testSummary: {
        passed: testExecution.passed,
        total: testExecution.total,
        testResults: testExecution.testResults,
        error: testExecution.error,
      },
      aiReview,
      attemptId,
    };
  }

  /**
   * Get graduated Socratic hints for a problem (Levels 1–3).
   */
  async getProblemHint(problemId: string, hintLevel: number) {
    const problem = await this.getProblemById(problemId);
    if (!problem) throw new Error('Problem not found');

    const level = Math.min(Math.max(hintLevel, 1), 3);

    const hintsByProblem: Record<string, Record<number, { title: string; content: string }>> = {
      '66666666-0001-0001-0001-000000000001': {
        1: {
          title: 'Hint 1: Pattern Recognition',
          content:
            'The input array is already sorted in ascending order and requires O(log n) time. That points directly to the Binary Search pattern where each comparison eliminates half the remaining candidates.',
        },
        2: {
          title: 'Hint 2: Algorithmic Invariant',
          content:
            'Maintain two pointers, `left` and `right`. In each step, compute `mid = left + Math.floor((right - left) / 2)`. If `nums[mid] < target`, the target cannot possibly be in the left half, so advance `left = mid + 1`.',
        },
        3: {
          title: 'Hint 3: Boundary & Loop Conditions',
          content:
            'Use `while (left <= right)` with a closed interval. When shrinking boundaries, make sure to exclude `mid` by setting `left = mid + 1` or `right = mid - 1` to prevent infinite loops.',
        },
      },
      '66666666-0001-0001-0001-000000000002': {
        1: {
          title: 'Hint 1: Virtual 1D Coordinate Mapping',
          content:
            'Notice that the matrix is sorted from top-left to bottom-right across row boundaries. Can you treat this entire m x n matrix as a single flattened 1D array of length m * n?',
        },
        2: {
          title: 'Hint 2: Index Coordinate Conversion',
          content:
            'Given a virtual 1D index `mid` between `0` and `m * n - 1`, the corresponding 2D matrix cell is `row = Math.floor(mid / n)` and `col = mid % n`.',
        },
        3: {
          title: 'Hint 3: Binary Search Execution',
          content:
            'Run standard binary search between `0` and `m * n - 1`. Read `val = matrix[Math.floor(mid / n)][mid % n]`. If `val === target` return true; adjust boundaries accordingly in O(log(m * n)).',
        },
      },
      '66666666-0001-0001-0001-000000000003': {
        1: {
          title: 'Hint 1: Identifying the Inflection Point',
          content:
            'The minimum element is the only element whose left neighbor is greater than itself (the rotation pivot).',
        },
        2: {
          title: 'Hint 2: Comparison with Right Boundary',
          content:
            'Compare `nums[mid]` with `nums[right]`. If `nums[mid] > nums[right]`, the inflection point and minimum MUST be strictly to the right of `mid` (`left = mid + 1`).',
        },
        3: {
          title: 'Hint 3: Left < Right Loop Condition',
          content:
            'If `nums[mid] <= nums[right]`, `nums[mid]` could itself be the minimum, so keep `mid` by setting `right = mid`. Loop `while (left < right)` and return `nums[left]`.',
        },
      },
    };

    const problemHints = hintsByProblem[problemId] || {
      1: {
        title: 'Hint 1: Think Directionally',
        content: 'Identify which half of the search space cannot contain the answer.',
      },
      2: {
        title: 'Hint 2: Pointer Movement',
        content: 'Ensure your left and right pointers converge toward the solution monotonically.',
      },
      3: {
        title: 'Hint 3: Edge Cases',
        content: 'Check arrays of length 1, 2, and boundary values at index 0 and length - 1.',
      },
    };

    return problemHints[level] || problemHints[1];
  }
}

export const problemsService = new ProblemsService();
