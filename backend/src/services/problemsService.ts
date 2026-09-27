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
