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
      "Feasibility condition is monotonic: if k works, all k' > k (or k' < k) also work",
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
  {
    id: '55555555-0001-0001-0001-000000000004',
    name: 'Sliding Window',
    description:
      'Maintaining a dynamic window of contiguous elements to compute aggregate properties (sums, counts, uniqueness) in O(n) time.',
    difficulty: 'beginner',
    recognition_signals: [
      'Find max/min/count in a contiguous subarray or substring of length k',
      'Constraint involves "at most k distinct" or "sum <= target"',
      'Brute force would check every substring in O(n^2) but the answer can slide incrementally',
    ],
    common_mistakes: [
      'Forgetting to shrink the window when the constraint is violated',
      'Off-by-one in window size: using right - left instead of right - left + 1',
      'Not updating the answer at every valid window state, missing the optimal solution',
    ],
    sort_order: 4,
  },
  {
    id: '55555555-0001-0001-0001-000000000005',
    name: 'Hash Map / Hash Set',
    description:
      'Using O(1) lookup/insertion to count frequencies, detect duplicates, or map values for efficient pair/group finding.',
    difficulty: 'beginner',
    recognition_signals: [
      'Need to check if a value exists in O(1) time',
      'Counting occurrences or frequencies of elements',
      'Finding complement pairs (e.g., two numbers summing to target)',
    ],
    common_mistakes: [
      'Not handling hash collisions or assuming perfect hashing in edge cases',
      'Forgetting to check if key exists before accessing, causing undefined/null errors',
      'Using arrays instead of hash maps when the key space is large or non-contiguous',
    ],
    sort_order: 5,
  },
  {
    id: '55555555-0001-0001-0001-000000000006',
    name: 'Stack (Monotonic & Parentheses)',
    description:
      'Using a LIFO structure to track unmatched symbols, maintain decreasing/increasing sequences, or compute nearest greater/smaller elements.',
    difficulty: 'beginner',
    recognition_signals: [
      'Matching or validating nested structures (parentheses, brackets, tags)',
      'Finding next greater/smaller element for each position',
      'Expression evaluation or postfix notation processing',
    ],
    common_mistakes: [
      'Popping from empty stack without checking isEmpty first',
      'Storing values instead of indices, preventing distance/span calculation',
      'Confusing monotonic increasing vs decreasing stack direction for the problem type',
    ],
    sort_order: 6,
  },
  {
    id: '55555555-0001-0001-0001-000000000007',
    name: 'BFS (Breadth-First Search)',
    description:
      'Level-by-level exploration of graph or tree structures, optimal for shortest path in unweighted graphs and level-order traversal.',
    difficulty: 'intermediate',
    recognition_signals: [
      'Finding shortest path in an unweighted graph or grid',
      'Level-order traversal of a tree',
      'Exploring all states at distance k before distance k+1',
    ],
    common_mistakes: [
      'Not marking nodes as visited before enqueueing, causing duplicates and TLE',
      'Confusing level boundaries when counting levels (forgetting to process entire level)',
      'Using DFS where BFS guarantees shortest path, producing suboptimal solutions',
    ],
    sort_order: 7,
  },
  {
    id: '55555555-0001-0001-0001-000000000008',
    name: 'DFS (Depth-First Search)',
    description:
      'Recursive or stack-based deep exploration for path finding, connected component detection, and exhaustive graph traversal.',
    difficulty: 'intermediate',
    recognition_signals: [
      'Counting connected components or detecting cycles',
      'Exploring all paths or checking reachability',
      'Tree traversal (pre-order, in-order, post-order) or backtracking foundation',
    ],
    common_mistakes: [
      'Stack overflow on deep recursion without iterative fallback',
      'Forgetting to mark visited nodes, causing infinite loops in cyclic graphs',
      'Not restoring state (backtracking) when exploring alternative paths',
    ],
    sort_order: 8,
  },
  {
    id: '55555555-0001-0001-0001-000000000009',
    name: 'Backtracking',
    description:
      'Systematic enumeration of all candidates by building solutions incrementally and abandoning paths that violate constraints (pruning).',
    difficulty: 'intermediate',
    recognition_signals: [
      'Generate all possible combinations, permutations, or subsets',
      'Constraint satisfaction (N-Queens, Sudoku solver)',
      'Decision tree where each choice branches into sub-problems',
    ],
    common_mistakes: [
      'Missing the undo step after recursive call, corrupting the shared state',
      'Not pruning invalid branches early, causing exponential blowup',
      'Generating duplicate solutions by not skipping repeated elements after sorting',
    ],
    sort_order: 9,
  },
  {
    id: '55555555-0001-0001-0001-000000000010',
    name: 'Dynamic Programming (1D)',
    description:
      'Breaking a problem into overlapping subproblems, storing results to avoid recomputation. Bottom-up tabulation or top-down memoization.',
    difficulty: 'intermediate',
    recognition_signals: [
      'Problem asks for "number of ways", "minimum cost", or "maximum value"',
      'Optimal substructure: optimal solution contains optimal solutions to sub-problems',
      'Overlapping subproblems: same sub-problem is solved multiple times in recursion',
    ],
    common_mistakes: [
      'Wrong base case initialization (e.g., dp[0] = 0 vs dp[0] = 1)',
      'Incorrect state transition formula, missing edge cases',
      'Not recognizing space optimization: O(n) table when only O(1) previous states are needed',
    ],
    sort_order: 10,
  },
  {
    id: '55555555-0001-0001-0001-000000000011',
    name: 'Dynamic Programming (2D / Multi-dimensional)',
    description:
      'Extending DP to problems requiring two or more state dimensions — grids, string matching, knapsack variants.',
    difficulty: 'advanced',
    recognition_signals: [
      'Grid pathfinding with obstacles or costs',
      'String comparison (edit distance, LCS, palindromic subsequences)',
      'Knapsack: select items with weight/value trade-offs',
    ],
    common_mistakes: [
      'Iterating in the wrong direction for the dependency pattern',
      'Confusing indices: dp[i][j] representing different things in different problems',
      'Not handling boundary conditions (first row, first column) separately',
    ],
    sort_order: 11,
  },
  {
    id: '55555555-0001-0001-0001-000000000012',
    name: 'Greedy Algorithm',
    description:
      'Making the locally optimal choice at each step to build a globally optimal solution, valid when greedy-choice property and optimal substructure hold.',
    difficulty: 'intermediate',
    recognition_signals: [
      'Problem asks for minimum/maximum with a sorting step that enables greedy selection',
      'Interval scheduling, activity selection, or job sequencing',
      'Each choice narrows the problem without needing to reconsider',
    ],
    common_mistakes: [
      'Applying greedy when the problem requires DP (no greedy-choice property)',
      'Sorting by the wrong criterion (e.g., by start time vs end time for intervals)',
      'Not proving correctness — greedy intuition can be misleading',
    ],
    sort_order: 12,
  },
  {
    id: '55555555-0001-0001-0001-000000000013',
    name: 'Linked List Techniques',
    description:
      'Pointer manipulation patterns for singly/doubly linked lists: fast-slow pointers, dummy heads, reversal, and merge operations.',
    difficulty: 'beginner',
    recognition_signals: [
      "Cycle detection in a linked list (Floyd's tortoise and hare)",
      'Finding the middle element or kth-from-end node',
      'In-place reversal or merging two sorted lists',
    ],
    common_mistakes: [
      'Losing reference to the head after manipulation — always use a dummy node',
      'Not handling null/empty list edge cases',
      'Incorrect pointer reassignment order causing lost nodes or infinite loops',
    ],
    sort_order: 13,
  },
  {
    id: '55555555-0001-0001-0001-000000000014',
    name: 'Heap / Priority Queue',
    description:
      'Maintaining a partially ordered collection for efficient extraction of min/max elements in O(log n) time.',
    difficulty: 'intermediate',
    recognition_signals: [
      'Finding the kth largest/smallest element',
      'Merging k sorted lists or streams',
      'Scheduling with priorities or top-k frequent elements',
    ],
    common_mistakes: [
      'Using max-heap when min-heap is needed (or vice versa)',
      'Not limiting heap size to k, causing O(n log n) instead of O(n log k)',
      'Forgetting that heap gives no guarantee on non-root element ordering',
    ],
    sort_order: 14,
  },
  {
    id: '55555555-0001-0001-0001-000000000015',
    name: 'Merge Intervals',
    description:
      'Sorting intervals by start time and merging overlapping ones, or inserting into a sorted interval list.',
    difficulty: 'beginner',
    recognition_signals: [
      'Input is a list of intervals or time ranges',
      'Detecting overlaps, conflicts, or free gaps',
      'Scheduling meetings, booking resources, or calendar operations',
    ],
    common_mistakes: [
      'Forgetting to sort intervals first before merging',
      'Using start comparison when end comparison is needed for overlap detection',
      'Not updating the end of the merged interval with Math.max',
    ],
    sort_order: 15,
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
  // --- New problems covering expanded patterns ---
  {
    id: '66666666-0001-0001-0001-000000000004',
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    difficulty: 'easy',
    category: 'Arrays',
    pattern_id: '55555555-0001-0001-0001-000000000005', // Hash Map
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    starter_code: {
      javascript: `function twoSum(nums, target) {
  // Your code here
}`,
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: [[2, 7, 11, 15], 9], expected_output: [0, 1] },
      { input: [[3, 2, 4], 6], expected_output: [1, 2] },
      { input: [[3, 3], 6], expected_output: [0, 1] },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000005',
    title: 'Valid Parentheses',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    difficulty: 'easy',
    category: 'Stack',
    pattern_id: '55555555-0001-0001-0001-000000000006', // Stack
    constraints: [
      '1 <= s.length <= 10^4',
      "s consists of parentheses only '()[]{}'",
    ],
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    starter_code: {
      javascript: `function isValid(s) {
  // Your code here
}`,
      python: `def isValid(s: str) -> bool:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: ['()'], expected_output: true },
      { input: ['()[]{}'], expected_output: true },
      { input: ['(]'], expected_output: false },
      { input: ['([)]'], expected_output: false },
      { input: ['{[]}'], expected_output: true },
      { input: [']'], expected_output: false },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000006',
    title: 'Maximum Subarray',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    difficulty: 'medium',
    category: 'Dynamic Programming',
    pattern_id: '55555555-0001-0001-0001-000000000010', // DP 1D
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    starter_code: {
      javascript: `function maxSubArray(nums) {
  // Your code here
}`,
      python: `def maxSubArray(nums: list[int]) -> int:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected_output: 6 },
      { input: [[1]], expected_output: 1 },
      { input: [[5, 4, -1, 7, 8]], expected_output: 23 },
      { input: [[-1]], expected_output: -1 },
      { input: [[-2, -1]], expected_output: -1 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000007',
    title: 'Climbing Stairs',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    difficulty: 'easy',
    category: 'Dynamic Programming',
    pattern_id: '55555555-0001-0001-0001-000000000010', // DP 1D
    constraints: [
      '1 <= n <= 45',
    ],
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' },
    ],
    starter_code: {
      javascript: `function climbStairs(n) {
  // Your code here
}`,
      python: `def climbStairs(n: int) -> int:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: [2], expected_output: 2 },
      { input: [3], expected_output: 3 },
      { input: [1], expected_output: 1 },
      { input: [5], expected_output: 8 },
      { input: [10], expected_output: 89 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000008',
    title: 'Best Time to Buy and Sell Stock',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`ith\` day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    difficulty: 'easy',
    category: 'Arrays',
    pattern_id: '55555555-0001-0001-0001-000000000004', // Sliding Window / Kadane's variant
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4',
    ],
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price=1), sell on day 5 (price=6), profit = 5' },
      { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'No profitable transaction is possible' },
    ],
    starter_code: {
      javascript: `function maxProfit(prices) {
  // Your code here
}`,
      python: `def maxProfit(prices: list[int]) -> int:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: [[7, 1, 5, 3, 6, 4]], expected_output: 5 },
      { input: [[7, 6, 4, 3, 1]], expected_output: 0 },
      { input: [[2, 4, 1]], expected_output: 2 },
      { input: [[1]], expected_output: 0 },
      { input: [[1, 2]], expected_output: 1 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000009',
    title: 'Container With Most Water',
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`ith\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.`,
    difficulty: 'medium',
    category: 'Arrays',
    pattern_id: '55555555-0001-0001-0001-000000000003', // Two Pointers
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4',
    ],
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49' },
      { input: 'height = [1,1]', output: '1' },
    ],
    starter_code: {
      javascript: `function maxArea(height) {
  // Your code here
}`,
      python: `def maxArea(height: list[int]) -> int:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected_output: 49 },
      { input: [[1, 1]], expected_output: 1 },
      { input: [[4, 3, 2, 1, 4]], expected_output: 16 },
      { input: [[1, 2, 1]], expected_output: 2 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000010',
    title: 'Coin Change',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    difficulty: 'medium',
    category: 'Dynamic Programming',
    pattern_id: '55555555-0001-0001-0001-000000000010', // DP 1D
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4',
    ],
    examples: [
      { input: 'coins = [1,5,10], amount = 12', output: '3', explanation: '12 = 10 + 1 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1' },
      { input: 'coins = [1], amount = 0', output: '0' },
    ],
    starter_code: {
      javascript: `function coinChange(coins, amount) {
  // Your code here
}`,
      python: `def coinChange(coins: list[int], amount: int) -> int:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: [[1, 5, 10], 12], expected_output: 3 },
      { input: [[2], 3], expected_output: -1 },
      { input: [[1], 0], expected_output: 0 },
      { input: [[1, 2, 5], 11], expected_output: 3 },
      { input: [[2], 1], expected_output: -1 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000011',
    title: 'Merge Intervals',
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    difficulty: 'medium',
    category: 'Intervals',
    pattern_id: '55555555-0001-0001-0001-000000000015', // Merge Intervals
    constraints: [
      '1 <= intervals.length <= 10^4',
      'intervals[i].length == 2',
      '0 <= start_i <= end_i <= 10^4',
    ],
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap, merged to [1,6]' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Intervals [1,4] and [4,5] are touching, merged to [1,5]' },
    ],
    starter_code: {
      javascript: `function merge(intervals) {
  // Your code here
}`,
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected_output: [[1, 6], [8, 10], [15, 18]] },
      { input: [[[1, 4], [4, 5]]], expected_output: [[1, 5]] },
      { input: [[[1, 4], [0, 4]]], expected_output: [[0, 4]] },
      { input: [[[1, 4], [2, 3]]], expected_output: [[1, 4]] },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000012',
    title: 'Maximum Subarray Sum of Size K',
    description: `Given an array of integers \`nums\` and an integer \`k\`, find the maximum sum of any contiguous subarray of size \`k\`.`,
    difficulty: 'easy',
    category: 'Arrays',
    pattern_id: '55555555-0001-0001-0001-000000000004', // Sliding Window
    constraints: [
      '1 <= k <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    examples: [
      { input: 'nums = [2,1,5,1,3,2], k = 3', output: '9', explanation: 'Subarray [5,1,3] has the maximum sum 9' },
      { input: 'nums = [2,3,4,1,5], k = 2', output: '7', explanation: 'Subarray [2,3] or [4,1] or [1,5]; max is [2,5]? No — [3,4]=7' },
    ],
    starter_code: {
      javascript: `function maxSubarraySum(nums, k) {
  // Your code here
}`,
      python: `def maxSubarraySum(nums: list[int], k: int) -> int:
    # Your code here
    pass`,
    },
    test_cases: [
      { input: [[2, 1, 5, 1, 3, 2], 3], expected_output: 9 },
      { input: [[2, 3, 4, 1, 5], 2], expected_output: 7 },
      { input: [[1, 2, 3], 3], expected_output: 6 },
      { input: [[5], 1], expected_output: 5 },
      { input: [[-1, -2, -3, -4], 2], expected_output: -3 },
    ],
  },
  // ======= WAVE 2: Cover uncovered & under-covered patterns =======
  // --- BFS (Pattern 007) ---
  {
    id: '66666666-0001-0001-0001-000000000013',
    title: 'Number of Islands',
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are surrounded by water.`,
    difficulty: 'medium',
    category: 'Graph',
    pattern_id: '55555555-0001-0001-0001-000000000007',
    constraints: [
      'm == grid.length',
      'n == grid[i].length',
      '1 <= m, n <= 300',
      "grid[i][j] is '0' or '1'",
    ],
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' },
    ],
    starter_code: {
      javascript: `function numIslands(grid) {\n  // Your code here\n}`,
      python: `def numIslands(grid: list[list[str]]) -> int:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]], expected_output: 3 },
      { input: [[["1","1","1"],["0","1","0"],["1","1","1"]]], expected_output: 1 },
      { input: [[["0"]]], expected_output: 0 },
      { input: [[["1"]]], expected_output: 1 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000014',
    title: 'Rotting Oranges',
    description: `You are given an \`m x n\` grid where each cell can have one of three values: \`0\` (empty), \`1\` (fresh orange), or \`2\` (rotten orange). Every minute, any fresh orange adjacent (4-directionally) to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return \`-1\`.`,
    difficulty: 'medium',
    category: 'Graph',
    pattern_id: '55555555-0001-0001-0001-000000000007',
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 10', 'grid[i][j] is 0, 1, or 2'],
    examples: [
      { input: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', output: '4' },
      { input: 'grid = [[2,1,1],[0,1,1],[1,0,1]]', output: '-1' },
      { input: 'grid = [[0,2]]', output: '0' },
    ],
    starter_code: {
      javascript: `function orangesRotting(grid) {\n  // Your code here\n}`,
      python: `def orangesRotting(grid: list[list[int]]) -> int:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[[2,1,1],[1,1,0],[0,1,1]]], expected_output: 4 },
      { input: [[[2,1,1],[0,1,1],[1,0,1]]], expected_output: -1 },
      { input: [[[0,2]]], expected_output: 0 },
      { input: [[[0]]], expected_output: 0 },
    ],
  },
  // --- DFS (Pattern 008) ---
  {
    id: '66666666-0001-0001-0001-000000000015',
    title: 'Maximum Depth of Binary Tree',
    description: `Given the \`root\` of a binary tree, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

Input is given as a level-order array where \`null\` represents absent nodes.`,
    difficulty: 'easy',
    category: 'Trees',
    pattern_id: '55555555-0001-0001-0001-000000000008',
    constraints: ['The number of nodes is in the range [0, 10^4]', '-100 <= Node.val <= 100'],
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '3' },
      { input: 'root = [1,null,2]', output: '2' },
    ],
    starter_code: {
      javascript: `function maxDepth(root) {\n  // Your code here\n}`,
      python: `def maxDepth(root) -> int:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[3,9,20,null,null,15,7]], expected_output: 3 },
      { input: [[1,null,2]], expected_output: 2 },
      { input: [[]], expected_output: 0 },
      { input: [[1]], expected_output: 1 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000016',
    title: 'Path Sum',
    description: `Given the \`root\` of a binary tree and an integer \`targetSum\`, return \`true\` if the tree has a root-to-leaf path such that adding up all the values along the path equals \`targetSum\`.

A leaf is a node with no children.`,
    difficulty: 'easy',
    category: 'Trees',
    pattern_id: '55555555-0001-0001-0001-000000000008',
    constraints: ['The number of nodes is in the range [0, 5000]', '-1000 <= Node.val <= 1000', '-1000 <= targetSum <= 1000'],
    examples: [
      { input: 'root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22', output: 'true', explanation: 'Path: 5 -> 4 -> 11 -> 2 sums to 22' },
      { input: 'root = [1,2,3], targetSum = 5', output: 'false' },
    ],
    starter_code: {
      javascript: `function hasPathSum(root, targetSum) {\n  // Your code here\n}`,
      python: `def hasPathSum(root, targetSum: int) -> bool:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[5,4,8,11,null,13,4,7,2,null,null,null,1], 22], expected_output: true },
      { input: [[1,2,3], 5], expected_output: false },
      { input: [[], 0], expected_output: false },
      { input: [[1], 1], expected_output: true },
    ],
  },
  // --- Backtracking (Pattern 009) ---
  {
    id: '66666666-0001-0001-0001-000000000017',
    title: 'Subsets',
    description: `Given an integer array \`nums\` of unique elements, return all possible subsets (the power set).

The solution set must not contain duplicate subsets. Return the solution in any order.`,
    difficulty: 'medium',
    category: 'Backtracking',
    pattern_id: '55555555-0001-0001-0001-000000000009',
    constraints: ['1 <= nums.length <= 10', '-10 <= nums[i] <= 10', 'All elements are unique'],
    examples: [
      { input: 'nums = [1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' },
      { input: 'nums = [0]', output: '[[],[0]]' },
    ],
    starter_code: {
      javascript: `function subsets(nums) {\n  // Your code here\n}`,
      python: `def subsets(nums: list[int]) -> list[list[int]]:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[1,2,3]], expected_output: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]] },
      { input: [[0]], expected_output: [[],[0]] },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000018',
    title: 'Permutations',
    description: `Given an array \`nums\` of distinct integers, return all possible permutations. You can return the answer in any order.`,
    difficulty: 'medium',
    category: 'Backtracking',
    pattern_id: '55555555-0001-0001-0001-000000000009',
    constraints: ['1 <= nums.length <= 6', '-10 <= nums[i] <= 10', 'All elements are unique'],
    examples: [
      { input: 'nums = [1,2,3]', output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' },
      { input: 'nums = [1]', output: '[[1]]' },
    ],
    starter_code: {
      javascript: `function permute(nums) {\n  // Your code here\n}`,
      python: `def permute(nums: list[int]) -> list[list[int]]:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[1,2,3]], expected_output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]] },
      { input: [[0,1]], expected_output: [[0,1],[1,0]] },
      { input: [[1]], expected_output: [[1]] },
    ],
  },
  // --- DP 2D (Pattern 011) ---
  {
    id: '66666666-0001-0001-0001-000000000019',
    title: 'Unique Paths',
    description: `A robot is located at the top-left corner of an \`m x n\` grid. The robot can only move either down or right at any point in time.

How many possible unique paths are there to reach the bottom-right corner?`,
    difficulty: 'medium',
    category: 'Dynamic Programming',
    pattern_id: '55555555-0001-0001-0001-000000000011',
    constraints: ['1 <= m, n <= 100'],
    examples: [
      { input: 'm = 3, n = 7', output: '28' },
      { input: 'm = 3, n = 2', output: '3', explanation: 'Right+Down+Down, Down+Down+Right, Down+Right+Down' },
    ],
    starter_code: {
      javascript: `function uniquePaths(m, n) {\n  // Your code here\n}`,
      python: `def uniquePaths(m: int, n: int) -> int:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [3, 7], expected_output: 28 },
      { input: [3, 2], expected_output: 3 },
      { input: [1, 1], expected_output: 1 },
      { input: [7, 3], expected_output: 28 },
      { input: [3, 3], expected_output: 6 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000020',
    title: 'Longest Common Subsequence',
    description: `Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence. If there is no common subsequence, return \`0\`.

A subsequence of a string is a new string generated from the original string with some characters deleted without changing the relative order.`,
    difficulty: 'medium',
    category: 'Dynamic Programming',
    pattern_id: '55555555-0001-0001-0001-000000000011',
    constraints: ['1 <= text1.length, text2.length <= 1000', 'text1 and text2 consist of only lowercase English characters'],
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'LCS is "ace"' },
      { input: 'text1 = "abc", text2 = "def"', output: '0' },
    ],
    starter_code: {
      javascript: `function longestCommonSubsequence(text1, text2) {\n  // Your code here\n}`,
      python: `def longestCommonSubsequence(text1: str, text2: str) -> int:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: ['abcde', 'ace'], expected_output: 3 },
      { input: ['abc', 'abc'], expected_output: 3 },
      { input: ['abc', 'def'], expected_output: 0 },
      { input: ['bl', 'yby'], expected_output: 1 },
    ],
  },
  // --- Greedy (Pattern 012) ---
  {
    id: '66666666-0001-0001-0001-000000000021',
    title: 'Jump Game',
    description: `You are given an integer array \`nums\`. You are initially positioned at the first index, and each element represents your maximum jump length at that position.

Return \`true\` if you can reach the last index, or \`false\` otherwise.`,
    difficulty: 'medium',
    category: 'Greedy',
    pattern_id: '55555555-0001-0001-0001-000000000012',
    constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 10^5'],
    examples: [
      { input: 'nums = [2,3,1,1,4]', output: 'true', explanation: 'Jump 1 step from index 0 to 1, then 3 steps to the last' },
      { input: 'nums = [3,2,1,0,4]', output: 'false', explanation: 'Always stuck at index 3' },
    ],
    starter_code: {
      javascript: `function canJump(nums) {\n  // Your code here\n}`,
      python: `def canJump(nums: list[int]) -> bool:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[2,3,1,1,4]], expected_output: true },
      { input: [[3,2,1,0,4]], expected_output: false },
      { input: [[0]], expected_output: true },
      { input: [[2,0]], expected_output: true },
      { input: [[1,0,1,0]], expected_output: false },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000022',
    title: 'Non-overlapping Intervals',
    description: `Given an array of intervals \`intervals\` where \`intervals[i] = [start_i, end_i]\`, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.`,
    difficulty: 'medium',
    category: 'Greedy',
    pattern_id: '55555555-0001-0001-0001-000000000012',
    constraints: ['1 <= intervals.length <= 10^5', 'intervals[i].length == 2', '-5 * 10^4 <= start_i < end_i <= 5 * 10^4'],
    examples: [
      { input: 'intervals = [[1,2],[2,3],[3,4],[1,3]]', output: '1', explanation: 'Remove [1,3] to make the rest non-overlapping' },
      { input: 'intervals = [[1,2],[1,2],[1,2]]', output: '2' },
    ],
    starter_code: {
      javascript: `function eraseOverlapIntervals(intervals) {\n  // Your code here\n}`,
      python: `def eraseOverlapIntervals(intervals: list[list[int]]) -> int:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[[1,2],[2,3],[3,4],[1,3]]], expected_output: 1 },
      { input: [[[1,2],[1,2],[1,2]]], expected_output: 2 },
      { input: [[[1,2],[2,3]]], expected_output: 0 },
    ],
  },
  // --- Linked List (Pattern 013) ---
  {
    id: '66666666-0001-0001-0001-000000000023',
    title: 'Reverse Linked List',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

Input is given as an array for simplicity. Return the reversed array.`,
    difficulty: 'easy',
    category: 'Linked List',
    pattern_id: '55555555-0001-0001-0001-000000000013',
    constraints: ['The number of nodes is in the range [0, 5000]', '-5000 <= Node.val <= 5000'],
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
      { input: 'head = []', output: '[]' },
    ],
    starter_code: {
      javascript: `function reverseList(head) {\n  // Treat head as an array. Reverse it in-place or return a new reversed array.\n  // Your code here\n}`,
      python: `def reverseList(head: list[int]) -> list[int]:\n    # Treat head as an array. Return the reversed list.\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[1,2,3,4,5]], expected_output: [5,4,3,2,1] },
      { input: [[1,2]], expected_output: [2,1] },
      { input: [[]], expected_output: [] },
      { input: [[1]], expected_output: [1] },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000024',
    title: 'Linked List Cycle Detection',
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

For simplicity, the input is an array and a \`pos\` value indicating where the tail connects to (0-indexed, -1 if no cycle). Return \`true\` if there is a cycle, \`false\` otherwise.`,
    difficulty: 'easy',
    category: 'Linked List',
    pattern_id: '55555555-0001-0001-0001-000000000013',
    constraints: ['The number of nodes is in the range [0, 10^4]', '-10^5 <= Node.val <= 10^5', 'pos is -1 or a valid index'],
    examples: [
      { input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'Tail connects to node index 1' },
      { input: 'head = [1], pos = -1', output: 'false' },
    ],
    starter_code: {
      javascript: `function hasCycle(head, pos) {\n  // Your code here — use Floyd's fast/slow pointer approach\n}`,
      python: `def hasCycle(head: list[int], pos: int) -> bool:\n    # Your code here — use Floyd's fast/slow pointer approach\n    pass`,
    },
    test_cases: [
      { input: [[3,2,0,-4], 1], expected_output: true },
      { input: [[1,2], 0], expected_output: true },
      { input: [[1], -1], expected_output: false },
      { input: [[], -1], expected_output: false },
    ],
  },
  // --- Heap / Priority Queue (Pattern 014) ---
  {
    id: '66666666-0001-0001-0001-000000000025',
    title: 'Kth Largest Element in an Array',
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`kth\` largest element in the array.

Note that it is the \`kth\` largest element in sorted order, not the \`kth\` distinct element.`,
    difficulty: 'medium',
    category: 'Sorting',
    pattern_id: '55555555-0001-0001-0001-000000000014',
    constraints: ['1 <= k <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    examples: [
      { input: 'nums = [3,2,1,5,6,4], k = 2', output: '5' },
      { input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', output: '4' },
    ],
    starter_code: {
      javascript: `function findKthLargest(nums, k) {\n  // Your code here\n}`,
      python: `def findKthLargest(nums: list[int], k: int) -> int:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[3,2,1,5,6,4], 2], expected_output: 5 },
      { input: [[3,2,3,1,2,4,5,5,6], 4], expected_output: 4 },
      { input: [[1], 1], expected_output: 1 },
      { input: [[7,6,5,4,3,2,1], 5], expected_output: 3 },
    ],
  },
  {
    id: '66666666-0001-0001-0001-000000000026',
    title: 'Top K Frequent Elements',
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements. You may return the answer in any order.`,
    difficulty: 'medium',
    category: 'Hash Map',
    pattern_id: '55555555-0001-0001-0001-000000000014',
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', 'k is in the range [1, number of unique elements]'],
    examples: [
      { input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' },
      { input: 'nums = [1], k = 1', output: '[1]' },
    ],
    starter_code: {
      javascript: `function topKFrequent(nums, k) {\n  // Your code here\n}`,
      python: `def topKFrequent(nums: list[int], k: int) -> list[int]:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[1,1,1,2,2,3], 2], expected_output: [1,2] },
      { input: [[1], 1], expected_output: [1] },
      { input: [[4,4,4,1,1,2,2,2,3], 2], expected_output: [4,2] },
    ],
  },
  // --- More Two Pointers (Pattern 003) ---
  {
    id: '66666666-0001-0001-0001-000000000027',
    title: 'Valid Palindrome',
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    difficulty: 'easy',
    category: 'Strings',
    pattern_id: '55555555-0001-0001-0001-000000000003',
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters'],
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true' },
      { input: 's = "race a car"', output: 'false' },
      { input: 's = " "', output: 'true' },
    ],
    starter_code: {
      javascript: `function isPalindrome(s) {\n  // Your code here\n}`,
      python: `def isPalindrome(s: str) -> bool:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: ['A man, a plan, a canal: Panama'], expected_output: true },
      { input: ['race a car'], expected_output: false },
      { input: [' '], expected_output: true },
      { input: ['a'], expected_output: true },
      { input: ['ab'], expected_output: false },
    ],
  },
  // --- More Hash Map (Pattern 005) ---
  {
    id: '66666666-0001-0001-0001-000000000028',
    title: 'Group Anagrams',
    description: `Given an array of strings \`strs\`, group the anagrams together. You can return the answer in any order.

An anagram is a word formed by rearranging the letters of another word.`,
    difficulty: 'medium',
    category: 'Strings',
    pattern_id: '55555555-0001-0001-0001-000000000005',
    constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters'],
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
      { input: 'strs = [""]', output: '[[""]]' },
    ],
    starter_code: {
      javascript: `function groupAnagrams(strs) {\n  // Your code here\n}`,
      python: `def groupAnagrams(strs: list[str]) -> list[list[str]]:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [['eat','tea','tan','ate','nat','bat']], expected_output: [['eat','tea','ate'],['tan','nat'],['bat']] },
      { input: [['a']], expected_output: [['a']] },
      { input: [['']], expected_output: [['']] },
    ],
  },
  // --- BS on Answer (Pattern 002) ---
  {
    id: '66666666-0001-0001-0001-000000000029',
    title: 'Koko Eating Bananas',
    description: `Koko loves to eat bananas. There are \`n\` piles of bananas, the \`ith\` pile has \`piles[i]\` bananas. Koko can decide her eating speed \`k\` (bananas/hour). Each hour, she eats \`k\` bananas from a pile. If the pile has fewer than \`k\`, she eats the whole pile and won't eat more that hour.

Return the minimum integer \`k\` such that she can eat all bananas within \`h\` hours.`,
    difficulty: 'medium',
    category: 'Binary Search',
    pattern_id: '55555555-0001-0001-0001-000000000002',
    constraints: ['1 <= piles.length <= 10^4', 'piles.length <= h <= 10^9', '1 <= piles[i] <= 10^9'],
    examples: [
      { input: 'piles = [3,6,7,11], h = 8', output: '4' },
      { input: 'piles = [30,11,23,4,20], h = 5', output: '30' },
    ],
    starter_code: {
      javascript: `function minEatingSpeed(piles, h) {\n  // Your code here\n}`,
      python: `def minEatingSpeed(piles: list[int], h: int) -> int:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[3,6,7,11], 8], expected_output: 4 },
      { input: [[30,11,23,4,20], 5], expected_output: 30 },
      { input: [[30,11,23,4,20], 6], expected_output: 23 },
      { input: [[1], 1], expected_output: 1 },
    ],
  },
  // --- More Stack (Pattern 006) ---
  {
    id: '66666666-0001-0001-0001-000000000030',
    title: 'Daily Temperatures',
    description: `Given an array of integers \`temperatures\` representing daily temperatures, return an array \`answer\` such that \`answer[i]\` is the number of days you have to wait after the \`ith\` day to get a warmer temperature. If there is no future day for which this is possible, keep \`answer[i] == 0\`.`,
    difficulty: 'medium',
    category: 'Stack',
    pattern_id: '55555555-0001-0001-0001-000000000006',
    constraints: ['1 <= temperatures.length <= 10^5', '30 <= temperatures[i] <= 100'],
    examples: [
      { input: 'temperatures = [73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]' },
      { input: 'temperatures = [30,40,50,60]', output: '[1,1,1,0]' },
    ],
    starter_code: {
      javascript: `function dailyTemperatures(temperatures) {\n  // Your code here\n}`,
      python: `def dailyTemperatures(temperatures: list[int]) -> list[int]:\n    # Your code here\n    pass`,
    },
    test_cases: [
      { input: [[73,74,75,71,69,72,76,73]], expected_output: [1,1,4,2,1,1,0,0] },
      { input: [[30,40,50,60]], expected_output: [1,1,1,0] },
      { input: [[30,60,90]], expected_output: [1,1,0] },
      { input: [[90]], expected_output: [0] },
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
      '66666666-0001-0001-0001-000000000004': {
        1: {
          title: 'Hint 1: Complement Lookup',
          content: 'For each number, the value you need to complete the pair is `target - nums[i]`. How can you check if you\'ve already seen that complement?',
        },
        2: {
          title: 'Hint 2: Hash Map for O(1) Lookup',
          content: 'Use a hash map to store each number and its index as you iterate. Before processing `nums[i]`, check if `target - nums[i]` exists in the map.',
        },
        3: {
          title: 'Hint 3: Single Pass',
          content: 'Iterate once: for each `nums[i]`, if `map.has(target - nums[i])`, return `[map.get(target - nums[i]), i]`. Otherwise, `map.set(nums[i], i)`. O(n) time, O(n) space.',
        },
      },
      '66666666-0001-0001-0001-000000000005': {
        1: {
          title: 'Hint 1: LIFO Matching',
          content: 'Opening brackets need to be closed in reverse order — the most recently opened bracket must be closed first. What data structure follows this "last in, first out" principle?',
        },
        2: {
          title: 'Hint 2: Stack Push/Pop',
          content: 'Push each opening bracket onto a stack. When you see a closing bracket, pop and check if it matches. If it doesn\'t match or the stack is empty, return false.',
        },
        3: {
          title: 'Hint 3: Final Check',
          content: 'After processing all characters, the stack must be empty for the string to be valid. Use a map: `{")":"(", "]":"[", "}":"{"}` for clean matching.',
        },
      },
      '66666666-0001-0001-0001-000000000006': {
        1: {
          title: 'Hint 1: Kadane\'s Insight',
          content: 'At each position, you have two choices: extend the current subarray or start a new one from the current element. Which choice gives a larger sum?',
        },
        2: {
          title: 'Hint 2: Local vs Global Maximum',
          content: 'Maintain `currentSum = Math.max(nums[i], currentSum + nums[i])`. Track the `maxSum` seen so far across all positions.',
        },
        3: {
          title: 'Hint 3: Space Optimization',
          content: 'You only need two variables: `currentSum` (running best ending here) and `maxSum` (global best). Initialize both to `nums[0]` and iterate from index 1.',
        },
      },
      '66666666-0001-0001-0001-000000000007': {
        1: {
          title: 'Hint 1: Fibonacci Connection',
          content: 'To reach step `n`, you must have come from step `n-1` (1 step) or step `n-2` (2 steps). How many ways are there to reach those two steps?',
        },
        2: {
          title: 'Hint 2: Recurrence Relation',
          content: 'The number of ways to reach step n is `dp[n] = dp[n-1] + dp[n-2]`. Base cases: `dp[1] = 1`, `dp[2] = 2`.',
        },
        3: {
          title: 'Hint 3: O(1) Space',
          content: 'You only need the previous two values. Use two variables `prev1` and `prev2`, updating them as you iterate from 3 to n.',
        },
      },
      '66666666-0001-0001-0001-000000000008': {
        1: {
          title: 'Hint 1: Track the Minimum',
          content: 'For maximum profit, you want to buy at the lowest price and sell at the highest price AFTER the buy day. Can you track the minimum price seen so far?',
        },
        2: {
          title: 'Hint 2: One Pass Scan',
          content: 'Iterate through prices. At each day, compute `profit = prices[i] - minPrice`. Update `maxProfit` if this profit is larger, then update `minPrice` if `prices[i]` is smaller.',
        },
        3: {
          title: 'Hint 3: Edge Case',
          content: 'Initialize `minPrice = prices[0]` and `maxProfit = 0`. If prices only decrease, `maxProfit` stays 0 (no transaction is made).',
        },
      },
      '66666666-0001-0001-0001-000000000009': {
        1: {
          title: 'Hint 1: Two Pointer Strategy',
          content: 'Start with the widest container (left = 0, right = n-1). The area is `Math.min(height[left], height[right]) * (right - left)`. How do you decide which pointer to move?',
        },
        2: {
          title: 'Hint 2: Move the Shorter Line',
          content: 'The shorter line limits the water level. Moving the taller line inward would only decrease width without gaining height. Always move the pointer at the shorter line.',
        },
        3: {
          title: 'Hint 3: Proof of Correctness',
          content: 'By always moving the shorter line, you never skip a potentially better container. The taller line can\'t form a better container with any line inside the current window.',
        },
      },
      '66666666-0001-0001-0001-000000000010': {
        1: {
          title: 'Hint 1: DP Table Definition',
          content: 'Let `dp[i]` represent the minimum number of coins needed to make amount `i`. What is `dp[0]`? What should `dp[i]` be if amount `i` is impossible?',
        },
        2: {
          title: 'Hint 2: Transition Formula',
          content: 'For each amount `i`, try every coin `c`: `dp[i] = Math.min(dp[i], dp[i - c] + 1)` for all coins where `c <= i`. Initialize `dp[i] = Infinity` for all `i > 0`.',
        },
        3: {
          title: 'Hint 3: Return Value',
          content: 'Return `dp[amount]` if it\'s less than `Infinity`, otherwise return `-1`. Build bottom-up from amount 0 to the target amount.',
        },
      },
      '66666666-0001-0001-0001-000000000011': {
        1: {
          title: 'Hint 1: Sort First',
          content: 'Sorting intervals by start time ensures overlapping intervals are adjacent. After sorting, you can merge in a single linear scan.',
        },
        2: {
          title: 'Hint 2: Overlap Detection',
          content: 'Two intervals overlap if the start of the current interval is <= the end of the last merged interval. When overlapping, extend the end: `merged.end = Math.max(merged.end, current.end)`.',
        },
        3: {
          title: 'Hint 3: Implementation',
          content: 'Sort by `start`. Initialize result with first interval. For each subsequent interval: if `interval[0] <= result[last][1]`, merge by updating end; otherwise push as new interval.',
        },
      },
      '66666666-0001-0001-0001-000000000012': {
        1: {
          title: 'Hint 1: Fixed Window Size',
          content: 'Since the window size is exactly `k`, you can compute the first window sum, then slide by adding the new element and removing the outgoing element.',
        },
        2: {
          title: 'Hint 2: Slide Efficiently',
          content: 'After computing `sum = nums[0] + ... + nums[k-1]`, for each position `i` from `k` to `n-1`: `sum = sum + nums[i] - nums[i - k]`. Track the maximum.',
        },
        3: {
          title: 'Hint 3: O(n) Time',
          content: 'This approach touches each element exactly twice (once added, once removed), giving O(n) time regardless of k. No nested loops needed.',
        },
      },
      // ===== WAVE 2 HINTS =====
      // --- BFS: Number of Islands ---
      '66666666-0001-0001-0001-000000000013': {
        1: { title: 'Hint 1: Connected Component Counting', content: 'Each island is a connected component of "1"s. Count how many distinct BFS/DFS traversals you need to visit all land cells.' },
        2: { title: 'Hint 2: BFS from Each Unvisited Land', content: 'Iterate through every cell. When you find an unvisited "1", increment count and BFS/DFS to mark all connected "1"s as visited.' },
        3: { title: 'Hint 3: Mark-in-Place', content: 'To avoid a separate visited array, mutate the grid: set visited cells to "0". Use a queue for BFS with 4-directional neighbors (up/down/left/right).' },
      },
      // --- BFS: Rotting Oranges ---
      '66666666-0001-0001-0001-000000000014': {
        1: { title: 'Hint 1: Multi-Source BFS', content: 'All rotten oranges spread simultaneously — this is multi-source BFS. Initialize the queue with ALL rotten orange positions at time 0.' },
        2: { title: 'Hint 2: Track Minutes via BFS Levels', content: 'Each BFS level = 1 minute. Process all cells at the current level before incrementing the timer. Fresh oranges adjacent to rotten ones become rotten.' },
        3: { title: 'Hint 3: Impossible Check', content: 'After BFS completes, if any fresh orange remains (grid cell still equals 1), return -1. Otherwise return the number of BFS levels processed.' },
      },
      // --- DFS: Max Depth of Binary Tree ---
      '66666666-0001-0001-0001-000000000015': {
        1: { title: 'Hint 1: Recursive Substructure', content: 'The max depth of a tree = 1 + max(depth of left subtree, depth of right subtree). This naturally maps to recursion (DFS).' },
        2: { title: 'Hint 2: Base Case', content: 'An empty tree (null node) has depth 0. This is your recursion base case.' },
        3: { title: 'Hint 3: One-Liner', content: 'return root === null ? 0 : 1 + Math.max(maxDepth(root.left), maxDepth(root.right))' },
      },
      // --- DFS: Path Sum ---
      '66666666-0001-0001-0001-000000000016': {
        1: { title: 'Hint 1: Reduce the Target', content: 'As you traverse from root to leaf, subtract each node\'s value from targetSum. At a leaf, check if the remaining sum equals 0.' },
        2: { title: 'Hint 2: Leaf Node Check', content: 'A leaf has no left and no right child. Only check sum equality at leaf nodes, not at intermediate nodes.' },
        3: { title: 'Hint 3: Recursive DFS', content: 'hasPathSum(node, remaining) = hasPathSum(node.left, remaining - node.val) || hasPathSum(node.right, remaining - node.val). Base: null → false, leaf with remaining == val → true.' },
      },
      // --- Backtracking: Subsets ---
      '66666666-0001-0001-0001-000000000017': {
        1: { title: 'Hint 1: Include/Exclude Decision', content: 'For each element, you have two choices: include it in the current subset or skip it. This creates a binary decision tree of depth n.' },
        2: { title: 'Hint 2: Backtracking Template', content: 'Use a recursive function with parameters (index, currentSubset). At each index, try including nums[index] and recurse, then backtrack (remove it) and recurse without it.' },
        3: { title: 'Hint 3: Base Case', content: 'When index === nums.length, add a copy of currentSubset to results. Make sure to clone the array, not push a reference.' },
      },
      // --- Backtracking: Permutations ---
      '66666666-0001-0001-0001-000000000018': {
        1: { title: 'Hint 1: Available Pool', content: 'At each position, choose from elements not yet used. Track used elements with a boolean array or by swapping.' },
        2: { title: 'Hint 2: Swap-Based Approach', content: 'Swap the current index with each index from current to end, recurse on current+1, then swap back. This generates all permutations without extra space for tracking.' },
        3: { title: 'Hint 3: Base Case', content: 'When current index equals the array length, a complete permutation is formed. Push a copy of the array to results.' },
      },
      // --- DP 2D: Unique Paths ---
      '66666666-0001-0001-0001-000000000019': {
        1: { title: 'Hint 1: Grid DP', content: 'dp[i][j] = number of ways to reach cell (i,j). The robot can only come from above or from the left.' },
        2: { title: 'Hint 2: Recurrence', content: 'dp[i][j] = dp[i-1][j] + dp[i][j-1]. Initialize entire first row and first column to 1 (only one way to reach any cell in row 0 or column 0).' },
        3: { title: 'Hint 3: Space Optimization', content: 'You only need the previous row to compute the current row, so you can reduce space from O(m*n) to O(n) using a 1D array.' },
      },
      // --- DP 2D: Longest Common Subsequence ---
      '66666666-0001-0001-0001-000000000020': {
        1: { title: 'Hint 1: 2D Table', content: 'Build a (m+1) x (n+1) table where dp[i][j] = LCS length of text1[0..i-1] and text2[0..j-1].' },
        2: { title: 'Hint 2: Recurrence', content: 'If text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1. Otherwise: dp[i][j] = max(dp[i-1][j], dp[i][j-1]).' },
        3: { title: 'Hint 3: Base Case', content: 'dp[0][j] = 0 and dp[i][0] = 0 for all i, j (empty string has LCS of 0 with anything). Answer is dp[m][n].' },
      },
      // --- Greedy: Jump Game ---
      '66666666-0001-0001-0001-000000000021': {
        1: { title: 'Hint 1: Track Maximum Reach', content: 'Maintain a variable `maxReach` representing the farthest index you can reach. Update it as you iterate.' },
        2: { title: 'Hint 2: Greedy Scan', content: 'For each index i (0 to n-1): if i > maxReach, you\'re stuck → return false. Otherwise, update maxReach = max(maxReach, i + nums[i]).' },
        3: { title: 'Hint 3: Early Exit', content: 'If maxReach >= n-1 at any point, return true immediately. This gives O(n) time, O(1) space.' },
      },
      // --- Greedy: Non-overlapping Intervals ---
      '66666666-0001-0001-0001-000000000022': {
        1: { title: 'Hint 1: Activity Selection', content: 'This is the classic interval scheduling / activity selection problem. Sort by end time and greedily keep non-overlapping intervals.' },
        2: { title: 'Hint 2: Sort by End Time', content: 'Sort intervals by their end time. For each interval, if it starts before the previous kept interval ends, it overlaps → remove it (increment count).' },
        3: { title: 'Hint 3: Count Removals', content: 'Total removals = intervals.length - (max non-overlapping intervals kept). This is equivalent to n minus the activity selection count.' },
      },
      // --- Linked List: Reverse Linked List ---
      '66666666-0001-0001-0001-000000000023': {
        1: { title: 'Hint 1: Three Pointers', content: 'Use three pointers: prev (starts null), curr (starts at head), next (temp). In each step, reverse curr\'s pointer to prev.' },
        2: { title: 'Hint 2: Iterative Steps', content: 'Save next = curr.next. Set curr.next = prev. Advance prev = curr, curr = next. Continue until curr is null.' },
        3: { title: 'Hint 3: Return prev', content: 'When curr becomes null, prev points to the new head (the old tail). Return prev. O(n) time, O(1) space.' },
      },
      // --- Linked List: Cycle Detection ---
      '66666666-0001-0001-0001-000000000024': {
        1: { title: 'Hint 1: Floyd\'s Tortoise and Hare', content: 'Use two pointers: slow moves 1 step, fast moves 2 steps. If there\'s a cycle, they will eventually meet inside the cycle.' },
        2: { title: 'Hint 2: Termination Condition', content: 'If fast reaches null (or fast.next is null), there is no cycle → return false. If slow === fast, a cycle exists → return true.' },
        3: { title: 'Hint 3: Why It Works', content: 'In a cycle of length C, the relative speed difference is 1 step/iteration, so fast catches slow within C iterations. O(n) time, O(1) space.' },
      },
      // --- Heap: Kth Largest Element ---
      '66666666-0001-0001-0001-000000000025': {
        1: { title: 'Hint 1: Min-Heap of Size K', content: 'Maintain a min-heap of size k. The top of the heap is always the kth largest element seen so far.' },
        2: { title: 'Hint 2: Process All Elements', content: 'For each element: push it to the heap. If heap size exceeds k, pop the minimum. After processing all elements, the heap top is the answer.' },
        3: { title: 'Hint 3: Alternative: Quickselect', content: 'For O(n) average time, use the Quickselect algorithm (partition like QuickSort but only recurse into the relevant half). Heap approach is O(n log k).' },
      },
      // --- Heap: Top K Frequent Elements ---
      '66666666-0001-0001-0001-000000000026': {
        1: { title: 'Hint 1: Count Frequencies First', content: 'Use a hash map to count the frequency of each element. Then find the k elements with the highest frequencies.' },
        2: { title: 'Hint 2: Min-Heap of Size K', content: 'Push (frequency, element) pairs into a min-heap of size k. If heap size exceeds k, pop the minimum frequency. Remaining k elements are the answer.' },
        3: { title: 'Hint 3: Bucket Sort Alternative', content: 'Create an array of buckets where index = frequency. Place elements into their frequency bucket. Iterate from highest frequency bucket and collect k elements. O(n) time.' },
      },
      // --- Two Pointers: Valid Palindrome ---
      '66666666-0001-0001-0001-000000000027': {
        1: { title: 'Hint 1: Two Pointers Inward', content: 'Place a left pointer at the start and right pointer at the end. Move them inward, comparing characters.' },
        2: { title: 'Hint 2: Skip Non-Alphanumeric', content: 'Skip characters that are not letters or digits. Use isalnum() or regex to check. Compare in lowercase.' },
        3: { title: 'Hint 3: Mismatch = Not Palindrome', content: 'If at any point the characters at left and right don\'t match (after lowercasing), return false. If pointers cross, return true.' },
      },
      // --- Hash Map: Group Anagrams ---
      '66666666-0001-0001-0001-000000000028': {
        1: { title: 'Hint 1: Canonical Key', content: 'Two strings are anagrams if they have the same sorted characters. Use the sorted string as a hash map key.' },
        2: { title: 'Hint 2: Group by Key', content: 'Create a map: sorted_string → list of original strings. Iterate through all strings, sort each, and append to its group.' },
        3: { title: 'Hint 3: Character Count Key', content: 'Alternative to sorting: use a character frequency count as the key (e.g., "a1b2c1") for O(n*k) instead of O(n*k*log k).' },
      },
      // --- BS on Answer: Koko Eating Bananas ---
      '66666666-0001-0001-0001-000000000029': {
        1: { title: 'Hint 1: Binary Search on the Answer', content: 'The answer k (eating speed) is between 1 and max(piles). Binary search on k: for a given speed, can Koko finish in h hours?' },
        2: { title: 'Hint 2: Feasibility Check', content: 'For speed k, hours needed = sum of ceil(pile/k) for each pile. If total hours <= h, k is feasible. Search for the minimum feasible k.' },
        3: { title: 'Hint 3: Binary Search Boundaries', content: 'lo = 1, hi = max(piles). If canFinish(mid), search left (hi = mid). Otherwise search right (lo = mid + 1). Return lo.' },
      },
      // --- Stack: Daily Temperatures ---
      '66666666-0001-0001-0001-000000000030': {
        1: { title: 'Hint 1: Monotonic Stack', content: 'Use a stack that stores indices of temperatures in decreasing order. When you find a warmer day, pop and calculate the difference.' },
        2: { title: 'Hint 2: Process Right to Left or Left to Right', content: 'Iterate left to right. For each temperature, pop all stack indices where temp[stack.top] < current temp. The difference in indices is the answer for each popped index.' },
        3: { title: 'Hint 3: Stack Invariant', content: 'The stack always contains indices of temperatures in decreasing order. Each index is pushed and popped at most once → O(n) total time.' },
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
