-- AlgoMentor AI — Phase 5: Problem Solving & DSA Patterns Schema
-- Based on DATABASE_SPEC.md §8, §9, §10, §11, §16 and FEATURE_SPEC.md

-- ============================================================
-- 1. Patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  recognition_signals JSONB DEFAULT '[]'::jsonb,
  common_mistakes JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Problems
-- ============================================================
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT NOT NULL,
  pattern_id UUID REFERENCES patterns(id) ON DELETE SET NULL,
  constraints JSONB DEFAULT '[]'::jsonb,
  examples JSONB DEFAULT '[]'::jsonb,
  starter_code JSONB NOT NULL DEFAULT '{}'::jsonb,
  test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. Problem Concepts (Many-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS problem_concepts (
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, concept_id)
);

-- ============================================================
-- 4. Problem Attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS problem_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  status TEXT NOT NULL CHECK (status IN ('attempted', 'passed', 'failed', 'solved_independently')),
  test_results JSONB DEFAULT '[]'::jsonb,
  ai_feedback JSONB DEFAULT '{}'::jsonb,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. Student Misconceptions (Cross-Session Tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_misconceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  misconception_tag TEXT NOT NULL,
  description TEXT NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  last_detected_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  UNIQUE (user_id, misconception_tag, concept_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_problems_pattern ON problems(pattern_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problem_concepts_concept ON problem_concepts(concept_id);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_user_problem ON problem_attempts(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_student_misconceptions_user ON student_misconceptions(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_misconceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patterns are publicly readable" ON patterns FOR SELECT USING (true);
CREATE POLICY "Problems are publicly readable" ON problems FOR SELECT USING (true);
CREATE POLICY "Problem concepts are publicly readable" ON problem_concepts FOR SELECT USING (true);

CREATE POLICY "Users can manage own attempts" ON problem_attempts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own misconceptions" ON student_misconceptions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Seed Data: Patterns
-- ============================================================
INSERT INTO patterns (id, name, description, difficulty, recognition_signals, common_mistakes, sort_order) VALUES
  (
    '55555555-0001-0001-0001-000000000001',
    'Binary Search On Sorted Array',
    'Locating a target value or boundary condition in a sorted collection by iteratively halving the search space.',
    'beginner',
    '[
      "Input is an array or monotonic function",
      "Goal asks for target position or insertion point with O(log n) time",
      "Directional elimination holds: if target is less than mid, everything right is excluded"
    ]'::jsonb,
    '[
      "Integer overflow in mid calculation: using (left + right) / 2 instead of left + (right - left) / 2",
      "Off-by-one boundary adjustment: assigning right = mid instead of mid - 1 in closed intervals",
      "Incorrect loop termination: left < right vs left <= right causing missed single-element targets"
    ]'::jsonb,
    1
  ),
  (
    '55555555-0001-0001-0001-000000000002',
    'Search Space Reduction / Binary Search On Answer',
    'Applying binary search over a discrete range of feasible answers rather than an input array index.',
    'intermediate',
    '[
      "Solution seeks min/max value satisfying a monotonic predicate",
      "Feasibility condition is monotonic: if k works, all k'' > k (or k'' < k) also work",
      "Easy to verify an answer in O(n), but hard to compute directly"
    ]'::jsonb,
    '[
      "Failing to verify monotonic behavior of feasibility check",
      "Incorrect search range initialization (left = 0 vs min element)",
      "Infinite loop when right = mid or left = mid without proper rounding"
    ]'::jsonb,
    2
  ),
  (
    '55555555-0001-0001-0001-000000000003',
    'Two Pointers',
    'Coordinating two indices moving across an array to find pairs, partitions, or intervals in linear time.',
    'beginner',
    '[
      "Sorted array asking for pairs with a target sum or difference",
      "In-place array element partitioning or reversal",
      "Palindrome verification or string matching"
    ]'::jsonb,
    '[
      "Incrementing both pointers simultaneously when only one should advance",
      "Index out of bounds when pointers cross",
      "Attempting on unsorted data where monotonicity does not hold"
    ]'::jsonb,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed Data: Problems
-- ============================================================
INSERT INTO problems (id, title, description, difficulty, category, pattern_id, constraints, examples, starter_code, test_cases, sort_order) VALUES
  (
    '66666666-0001-0001-0001-000000000001',
    'Binary Search',
    'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.

You must write an algorithm with `O(log n)` runtime complexity.',
    'easy',
    'Searching',
    '55555555-0001-0001-0001-000000000001',
    '[
      "1 <= nums.length <= 10^4",
      "-10^4 < nums[i], target < 10^4",
      "All the integers in nums are unique.",
      "nums is sorted in ascending order."
    ]'::jsonb,
    '[
      {
        "input": "nums = [-1,0,3,5,9,12], target = 9",
        "output": "4",
        "explanation": "9 exists in nums and its index is 4"
      },
      {
        "input": "nums = [-1,0,3,5,9,12], target = 2",
        "output": "-1",
        "explanation": "2 does not exist in nums so return -1"
      }
    ]'::jsonb,
    '{
      "javascript": "function search(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    let mid = Math.floor(left + (right - left) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n\n  return -1;\n}",
      "python": "def search(nums: list[int], target: int) -> int:\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = left + (right - left) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1"
    }'::jsonb,
    '[
      {"input": [[-1, 0, 3, 5, 9, 12], 9], "expected_output": 4},
      {"input": [[-1, 0, 3, 5, 9, 12], 2], "expected_output": -1},
      {"input": [[5], 5], "expected_output": 0},
      {"input": [[5], -5], "expected_output": -1},
      {"input": [[1, 3, 5, 7, 9, 11, 13, 15], 1], "expected_output": 0},
      {"input": [[1, 3, 5, 7, 9, 11, 13, 15], 15], "expected_output": 7}
    ]'::jsonb,
    1
  ),
  (
    '66666666-0001-0001-0001-000000000002',
    'Search a 2D Matrix',
    'You are given an `m x n` integer matrix `matrix` with the following two properties:
1. Each row is sorted in non-decreasing order.
2. The first integer of each row is greater than the last integer of the previous row.

Given an integer `target`, return `true` if `target` is in `matrix` or `false` otherwise.

You must write a solution in `O(log(m * n))` time complexity.',
    'medium',
    'Searching',
    '55555555-0001-0001-0001-000000000001',
    '[
      "m == matrix.length",
      "n == matrix[i].length",
      "1 <= m, n <= 100",
      "-10^4 <= matrix[i][j], target <= 10^4"
    ]'::jsonb,
    '[
      {
        "input": "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
        "output": "true"
      },
      {
        "input": "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13",
        "output": "false"
      }
    ]'::jsonb,
    '{
      "javascript": "function searchMatrix(matrix, target) {\n  const m = matrix.length;\n  const n = matrix[0].length;\n  let left = 0;\n  let right = m * n - 1;\n\n  while (left <= right) {\n    const mid = Math.floor(left + (right - left) / 2);\n    const row = Math.floor(mid / n);\n    const col = mid % n;\n    const val = matrix[row][col];\n\n    if (val === target) return true;\n    if (val < target) left = mid + 1;\n    else right = mid - 1;\n  }\n\n  return false;\n}",
      "python": "def searchMatrix(matrix: list[list[int]], target: int) -> bool:\n    m, n = len(matrix), len(matrix[0])\n    left, right = 0, m * n - 1\n    while left <= right:\n        mid = left + (right - left) // 2\n        val = matrix[mid // n][mid % n]\n        if val == target:\n            return True\n        elif val < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return False"
    }'::jsonb,
    '[
      {"input": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], "expected_output": true},
      {"input": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], "expected_output": false},
      {"input": [[[1]], 1], "expected_output": true},
      {"input": [[[1]], 0], "expected_output": false}
    ]'::jsonb,
    2
  ),
  (
    '66666666-0001-0001-0001-000000000003',
    'Find Minimum in Rotated Sorted Array',
    'Suppose an array of length `n` sorted in ascending order is rotated between `1` and `n` times.

Given the sorted rotated array `nums` of unique elements, return the minimum element of this array.

You must write an algorithm that runs in `O(log n)` time.',
    'medium',
    'Searching',
    '55555555-0001-0001-0001-000000000002',
    '[
      "n == nums.length",
      "1 <= n <= 5000",
      "-5000 <= nums[i] <= 5000",
      "All the integers of nums are unique.",
      "nums is sorted and rotated between 1 and n times."
    ]'::jsonb,
    '[
      {
        "input": "nums = [3,4,5,1,2]",
        "output": "1",
        "explanation": "The original array was [1,2,3,4,5] rotated 3 times."
      },
      {
        "input": "nums = [4,5,6,7,0,1,2]",
        "output": "0",
        "explanation": "The original array was [0,1,2,4,5,6,7] and it was rotated 4 times."
      }
    ]'::jsonb,
    '{
      "javascript": "function findMin(nums) {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left < right) {\n    const mid = Math.floor(left + (right - left) / 2);\n    if (nums[mid] > nums[right]) {\n      left = mid + 1;\n    } else {\n      right = mid;\n    }\n  }\n\n  return nums[left];\n}",
      "python": "def findMin(nums: list[int]) -> int:\n    left, right = 0, len(nums) - 1\n    while left < right:\n        mid = left + (right - left) // 2\n        if nums[mid] > nums[right]:\n            left = mid + 1\n        else:\n            right = mid\n    return nums[left]"
    }'::jsonb,
    '[
      {"input": [[3, 4, 5, 1, 2]], "expected_output": 1},
      {"input": [[4, 5, 6, 7, 0, 1, 2]], "expected_output": 0},
      {"input": [[11, 13, 15, 17]], "expected_output": 11},
      {"input": [[1]], "expected_output": 1},
      {"input": [[2, 1]], "expected_output": 1}
    ]'::jsonb,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed Data: Problem Concepts Link
-- ============================================================
INSERT INTO problem_concepts (problem_id, concept_id) VALUES
  -- LC 704 -> Binary Search
  ('66666666-0001-0001-0001-000000000001', '44444444-0004-0004-0004-000000000001'),
  -- LC 74 -> Binary Search & Sorted Arrays
  ('66666666-0001-0001-0001-000000000002', '44444444-0004-0004-0004-000000000001'),
  ('66666666-0001-0001-0001-000000000002', '44444444-0002-0002-0002-000000000002'),
  -- LC 153 -> Binary Search & Search Space Reduction
  ('66666666-0001-0001-0001-000000000003', '44444444-0004-0004-0004-000000000001'),
  ('66666666-0001-0001-0001-000000000003', '44444444-0004-0004-0004-000000000002')
ON CONFLICT (problem_id, concept_id) DO NOTHING;
