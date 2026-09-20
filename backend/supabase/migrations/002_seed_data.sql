-- AlgoMentor AI — Initial DSA Seed Data
-- A deliberately small curriculum for the first vertical slice.
-- Based on CONTENT_SYSTEM.md §8: "Start with a minimal but representative dataset."
--
-- Hierarchy: DSA Course → 2 Modules → Topics → Concepts with prerequisites

-- ============================================================
-- Course
-- ============================================================
INSERT INTO courses (id, title, description, difficulty) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Data Structures & Algorithms', 'Foundational DSA concepts for technical interviews and CS fundamentals.', 'beginner');

-- ============================================================
-- Modules
-- ============================================================
INSERT INTO modules (id, course_id, title, description, sort_order) VALUES
  ('22222222-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Foundations', 'Core concepts that underpin all DSA topics.', 1),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Searching', 'Search algorithms and techniques.', 2);

-- ============================================================
-- Topics
-- ============================================================
INSERT INTO topics (id, module_id, title, description, sort_order) VALUES
  -- Foundations module
  ('33333333-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Complexity Analysis', 'Understanding time and space complexity.', 1),
  ('33333333-2222-2222-2222-222222222222', '22222222-1111-1111-1111-111111111111', 'Arrays', 'Array fundamentals and operations.', 2),
  -- Searching module
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Linear Search', 'Sequential search techniques.', 1),
  ('33333333-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Binary Search', 'Divide and conquer search on sorted data.', 2);

-- ============================================================
-- Concepts
-- ============================================================
INSERT INTO concepts (id, topic_id, name, description, difficulty, learning_objectives) VALUES
  -- Complexity Analysis concepts
  ('44444444-0001-0001-0001-000000000001', '33333333-1111-1111-1111-111111111111',
   'Big-O Notation', 'Understanding asymptotic upper bounds for algorithm performance.',
   'beginner', '["Define Big-O notation", "Identify common complexities: O(1), O(n), O(n²), O(log n)", "Compare growth rates"]'::jsonb),

  ('44444444-0001-0001-0001-000000000002', '33333333-1111-1111-1111-111111111111',
   'Logarithmic Complexity', 'Understanding why halving operations lead to O(log n).',
   'beginner', '["Explain why halving produces logarithmic growth", "Calculate log₂ for powers of 2", "Connect logarithms to divide-and-conquer"]'::jsonb),

  -- Array concepts
  ('44444444-0002-0002-0002-000000000001', '33333333-2222-2222-2222-222222222222',
   'Array Basics', 'Contiguous memory, indexing, iteration.',
   'beginner', '["Describe array memory layout", "Access elements by index", "Iterate through arrays"]'::jsonb),

  ('44444444-0002-0002-0002-000000000002', '33333333-2222-2222-2222-222222222222',
   'Sorted Arrays', 'Properties and advantages of sorted data.',
   'beginner', '["Explain what makes data sorted", "Describe why sorted data enables faster search", "Identify operations that maintain sorted order"]'::jsonb),

  -- Linear Search concepts
  ('44444444-0003-0003-0003-000000000001', '33333333-3333-3333-3333-333333333333',
   'Linear Search', 'Sequential element-by-element search.',
   'beginner', '["Implement linear search", "Analyze O(n) complexity", "Identify when linear search is appropriate"]'::jsonb),

  -- Binary Search concepts
  ('44444444-0004-0004-0004-000000000001', '33333333-4444-4444-4444-444444444444',
   'Binary Search Algorithm', 'Efficient search on sorted arrays by halving the search space.',
   'intermediate', '["Explain the binary search invariant", "Implement binary search", "Analyze O(log n) complexity", "Identify the sorted-data precondition"]'::jsonb),

  ('44444444-0004-0004-0004-000000000002', '33333333-4444-4444-4444-444444444444',
   'Search Space Reduction', 'The principle of eliminating possibilities to narrow down a solution.',
   'beginner', '["Explain search space reduction", "Describe how binary search halves the search space", "Apply the concept to novel problems"]'::jsonb);

-- ============================================================
-- Concept Relationships (prerequisites)
-- ============================================================
INSERT INTO concept_relationships (source_concept_id, target_concept_id, relationship_type) VALUES
  -- Big-O is prerequisite for Logarithmic Complexity
  ('44444444-0001-0001-0001-000000000001', '44444444-0001-0001-0001-000000000002', 'prerequisite'),

  -- Array Basics is prerequisite for Sorted Arrays
  ('44444444-0002-0002-0002-000000000001', '44444444-0002-0002-0002-000000000002', 'prerequisite'),

  -- Array Basics is prerequisite for Linear Search
  ('44444444-0002-0002-0002-000000000001', '44444444-0003-0003-0003-000000000001', 'prerequisite'),

  -- Sorted Arrays is prerequisite for Binary Search
  ('44444444-0002-0002-0002-000000000002', '44444444-0004-0004-0004-000000000001', 'prerequisite'),

  -- Search Space Reduction is prerequisite for Binary Search
  ('44444444-0004-0004-0004-000000000002', '44444444-0004-0004-0004-000000000001', 'prerequisite'),

  -- Logarithmic Complexity is prerequisite for Binary Search
  ('44444444-0001-0001-0001-000000000002', '44444444-0004-0004-0004-000000000001', 'prerequisite'),

  -- Linear Search is related to Binary Search
  ('44444444-0003-0003-0003-000000000001', '44444444-0004-0004-0004-000000000001', 'related');
