-- =============================================================================
-- Migration 004: Revision & Spaced Repetition System (Phase 8)
-- =============================================================================
-- Implements SuperMemo SM-2 spaced repetition with Leitner 5-box categorization,
-- retrieval practice flashcards, and student review history.

-- 1. Create revision_items table
CREATE TABLE IF NOT EXISTS revision_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
    problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('concept', 'problem', 'invariant')),
    title TEXT NOT NULL,
    prompt_question TEXT NOT NULL,
    solution_explanation TEXT NOT NULL,
    key_invariant TEXT NOT NULL,
    repetition_count INTEGER NOT NULL DEFAULT 0,
    interval_days INTEGER NOT NULL DEFAULT 1,
    easiness_factor FLOAT NOT NULL DEFAULT 2.5,
    leitner_box INTEGER NOT NULL DEFAULT 1 CHECK (leitner_box BETWEEN 1 AND 5),
    next_review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    weakness_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast due-item retrieval
CREATE INDEX IF NOT EXISTS idx_revision_user_due ON revision_items (user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_revision_box ON revision_items (user_id, leitner_box);

-- 2. Create revision_logs table
CREATE TABLE IF NOT EXISTS revision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_item_id UUID NOT NULL REFERENCES revision_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 0 AND 5),
    previous_interval INTEGER NOT NULL,
    new_interval INTEGER NOT NULL,
    previous_ef FLOAT NOT NULL,
    new_ef FLOAT NOT NULL,
    confidence TEXT,
    time_spent_seconds INTEGER DEFAULT 0,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revision_logs_user ON revision_logs (user_id, reviewed_at);

-- 3. Seed starter algorithmic retrieval items
INSERT INTO revision_items (
    id,
    user_id,
    item_type,
    title,
    prompt_question,
    solution_explanation,
    key_invariant,
    repetition_count,
    interval_days,
    easiness_factor,
    leitner_box,
    next_review_date
) VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'invariant',
    'Binary Search — Midpoint & Overflow Invariant',
    'Why is `left + (right - left) // 2` mathematically preferred over `(left + right) // 2` in typed languages, and what is the loop invariant?',
    'In fixed-size integer systems (e.g. 32-bit signed integers), adding two large numbers near 2^31 - 1 can overflow into negative values. `left + (right - left) // 2` mathematically computes the identical midpoint while guaranteeing the addition never exceeds `right`. The loop invariant is: if target exists in nums, it must reside strictly within nums[left..right].',
    'Search space bounds nums[left..right] strictly shrink by half on every comparison without skipping target.',
    0,
    1,
    2.5,
    1,
    NOW() - INTERVAL '1 hour'
),
(
    'a1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'invariant',
    'Two Pointers — Sorted Two Sum Invariant',
    'Why does moving the left pointer rightward guarantee we never miss a valid pair when `nums[left] + nums[right] < target`?',
    'Because the array is sorted in ascending order, `nums[left]` is the smallest available value. Since `nums[left] + nums[right] < target`, adding `nums[left]` to any OTHER element (which is <= `nums[right]`) will produce an even smaller sum. Hence `nums[left]` cannot possibly form a valid sum with any remaining candidate.',
    'Monotonicity invariant: sorted order guarantees that moving left pointer strictly increases current sum, while moving right pointer strictly decreases it.',
    1,
    2,
    2.6,
    2,
    NOW() - INTERVAL '2 hours'
),
(
    'a1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'invariant',
    'Sliding Window — Dynamic Window Contracting',
    'When solving "Longest Substring Without Repeating Characters", what invariant triggers the left boundary to advance?',
    'The window invariant requires all elements in `s[left..right]` to have frequencies <= 1. When `s[right]` introduces a duplicate, the window is invalid. The left pointer must advance while decrementing frequencies until the duplicate count drops back to 1.',
    'Window validity invariant: Every candidate subarray maintains state validity between contractions.',
    2,
    5,
    2.4,
    3,
    NOW() + INTERVAL '1 day'
),
(
    'a1000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'concept',
    'BFS vs DFS — Shortest Path Invariant',
    'Why does standard Breadth-First Search (BFS) guarantee the shortest path in unweighted graphs whereas DFS does not?',
    'BFS explores nodes in non-decreasing order of depth using a FIFO queue. In an unweighted graph where every edge cost is 1, the first time node V is visited is guaranteed to be its minimal distance from the root. DFS explores deep paths first and may reach V through an unnecessarily long branch.',
    'Level-order radial expansion: All nodes at distance d are visited before any node at distance d+1.',
    3,
    9,
    2.5,
    4,
    NOW() + INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;
