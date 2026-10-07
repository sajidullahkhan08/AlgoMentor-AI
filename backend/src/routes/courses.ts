/**
 * Course routes.
 *
 * Provides curriculum browsing:
 * - GET /courses — list all courses (with seed fallback)
 * - GET /courses/:id — get course with its modules (with seed fallback)
 * - GET /courses/:courseId/modules/:moduleId/topics — get topics for a module
 */

import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/supabase';

export const courseRoutes = Router();

// ─── Seed Data (AlgoMaster-inspired Roadmap) ──────────────────────────

interface SeedModule {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  topics: { id: string; title: string; description: string; sort_order: number }[];
}

interface SeedCourse {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  modules: SeedModule[];
}

const SEED_COURSES: SeedCourse[] = [
  {
    id: 'course-dsa-fundamentals',
    title: 'DSA Fundamentals',
    description:
      'Master the building blocks — arrays, strings, hash maps, linked lists, stacks & queues. Every advanced pattern rests on these foundations.',
    difficulty: 'beginner',
    modules: [
      {
        id: 'mod-arrays-strings',
        title: 'Arrays & Strings',
        description: 'Traversals, in-place manipulation, prefix sums, and sliding windows on linear data.',
        sort_order: 1,
        topics: [
          { id: 'top-array-basics', title: 'Array Traversal & Manipulation', description: 'Iteration, reversal, rotation, and in-place operations.', sort_order: 1 },
          { id: 'top-prefix-sum', title: 'Prefix Sum & Difference Arrays', description: 'O(1) range-sum queries using cumulative prefix arrays.', sort_order: 2 },
          { id: 'top-sliding-window', title: 'Sliding Window Technique', description: 'Fixed and variable-length windows for subarray problems.', sort_order: 3 },
          { id: 'top-two-pointers', title: 'Two Pointers', description: 'Converging, diverging, and fast-slow pointer patterns.', sort_order: 4 },
        ],
      },
      {
        id: 'mod-hash-maps',
        title: 'Hash Maps & Sets',
        description: 'O(1) lookups, frequency counting, and collision resolution.',
        sort_order: 2,
        topics: [
          { id: 'top-hash-basics', title: 'Hash Table Internals', description: 'Hashing functions, load factor, and collision strategies (chaining vs open addressing).', sort_order: 1 },
          { id: 'top-freq-counting', title: 'Frequency Counting Patterns', description: 'Anagram detection, two-sum lookup, and occurrence tracking.', sort_order: 2 },
        ],
      },
      {
        id: 'mod-stacks-queues',
        title: 'Stacks & Queues',
        description: 'LIFO and FIFO data structures with monotonic stack applications.',
        sort_order: 3,
        topics: [
          { id: 'top-stack-basics', title: 'Stack Fundamentals', description: 'Parentheses matching, expression evaluation, and undo operations.', sort_order: 1 },
          { id: 'top-monotonic-stack', title: 'Monotonic Stack', description: 'Next Greater Element, Daily Temperatures, and histogram problems.', sort_order: 2 },
          { id: 'top-queue-bfs', title: 'Queue & BFS Basics', description: 'Level-order traversal, shortest path in unweighted graphs.', sort_order: 3 },
        ],
      },
      {
        id: 'mod-linked-lists',
        title: 'Linked Lists',
        description: 'Pointer manipulation, cycle detection, and reversal techniques.',
        sort_order: 4,
        topics: [
          { id: 'top-ll-basics', title: 'Singly Linked List Operations', description: 'Insertion, deletion, reversal, and merge operations.', sort_order: 1 },
          { id: 'top-ll-fast-slow', title: 'Fast & Slow Pointers', description: 'Cycle detection (Floyd\'s), middle finding, and palindrome checking.', sort_order: 2 },
        ],
      },
    ],
  },
  {
    id: 'course-algorithmic-patterns',
    title: 'Algorithmic Patterns',
    description:
      'Level up with the 15 core algorithmic patterns that appear in 90% of coding interviews — from Binary Search to Dynamic Programming.',
    difficulty: 'intermediate',
    modules: [
      {
        id: 'mod-binary-search',
        title: 'Binary Search Mastery',
        description: 'Classical binary search, search on answer, and rotated array variants.',
        sort_order: 1,
        topics: [
          { id: 'top-bs-classic', title: 'Classical Binary Search', description: 'Sorted array search with O(log n) invariant maintenance.', sort_order: 1 },
          { id: 'top-bs-on-answer', title: 'Binary Search on Answer', description: 'Koko Eating Bananas, minimum speed, capacity problems.', sort_order: 2 },
          { id: 'top-bs-rotated', title: 'Rotated & Modified Arrays', description: 'Finding pivots, minimum in rotated arrays, search in rotated arrays.', sort_order: 3 },
        ],
      },
      {
        id: 'mod-recursion-backtracking',
        title: 'Recursion & Backtracking',
        description: 'Explore decision trees, generate subsets and permutations, and prune search spaces.',
        sort_order: 2,
        topics: [
          { id: 'top-recursion', title: 'Recursion Fundamentals', description: 'Base cases, recursive leap of faith, and call stack visualization.', sort_order: 1 },
          { id: 'top-subsets-perms', title: 'Subsets & Permutations', description: 'Generate all subsets (power set) and permutations via backtracking.', sort_order: 2 },
          { id: 'top-constraint-backtrack', title: 'Constraint Backtracking', description: 'N-Queens, Sudoku Solver, and word search with pruning.', sort_order: 3 },
        ],
      },
      {
        id: 'mod-trees-graphs',
        title: 'Trees & Graphs',
        description: 'DFS, BFS, tree traversals, graph modeling, and shortest path algorithms.',
        sort_order: 3,
        topics: [
          { id: 'top-tree-dfs', title: 'Tree DFS (Pre/In/Post Order)', description: 'Recursive and iterative tree traversals, path problems.', sort_order: 1 },
          { id: 'top-tree-bfs', title: 'Tree & Graph BFS', description: 'Level-order, rotting oranges, shortest path in unweighted graphs.', sort_order: 2 },
          { id: 'top-graph-modeling', title: 'Graph Modeling & Traversal', description: 'Adjacency lists, visited sets, connected components, topological sort.', sort_order: 3 },
        ],
      },
      {
        id: 'mod-dp',
        title: 'Dynamic Programming',
        description: 'Build DP intuition from 1D through 2D with state transition design.',
        sort_order: 4,
        topics: [
          { id: 'top-dp-1d', title: '1D Dynamic Programming', description: 'Climbing Stairs, House Robber, Coin Change — single-dimension state transitions.', sort_order: 1 },
          { id: 'top-dp-2d', title: '2D Dynamic Programming', description: 'Unique Paths, LCS, Edit Distance — multi-dimensional state tables.', sort_order: 2 },
          { id: 'top-dp-patterns', title: 'DP Optimization Patterns', description: 'Space optimization, Kadane\'s algorithm, interval DP, and bitmask DP.', sort_order: 3 },
        ],
      },
      {
        id: 'mod-greedy-intervals',
        title: 'Greedy & Intervals',
        description: 'Greedy choice property, activity selection, and interval merging.',
        sort_order: 5,
        topics: [
          { id: 'top-greedy', title: 'Greedy Algorithms', description: 'Jump Game, gas station, task scheduler — proving greedy choice works.', sort_order: 1 },
          { id: 'top-intervals', title: 'Interval Problems', description: 'Merge intervals, insert interval, non-overlapping intervals.', sort_order: 2 },
        ],
      },
      {
        id: 'mod-heaps',
        title: 'Heaps & Priority Queues',
        description: 'Top-K problems, median finding, and merge K sorted structures.',
        sort_order: 6,
        topics: [
          { id: 'top-heap-basics', title: 'Heap Operations', description: 'Min-heap, max-heap, heapify, and priority queue API.', sort_order: 1 },
          { id: 'top-top-k', title: 'Top-K Pattern', description: 'Kth largest, top K frequent, K closest points using heaps.', sort_order: 2 },
        ],
      },
    ],
  },
  {
    id: 'course-system-design',
    title: 'System Design Fundamentals',
    description:
      'Learn to design scalable distributed systems — from URL shorteners to real-time chat — with back-of-envelope math and trade-off analysis.',
    difficulty: 'advanced',
    modules: [
      {
        id: 'mod-sd-foundations',
        title: 'System Design Foundations',
        description: 'Scaling, load balancing, caching, CDNs, and database fundamentals.',
        sort_order: 1,
        topics: [
          { id: 'top-sd-scaling', title: 'Horizontal vs Vertical Scaling', description: 'When to scale up vs out, stateless services, and auto-scaling.', sort_order: 1 },
          { id: 'top-sd-lb', title: 'Load Balancing & Reverse Proxies', description: 'Round-robin, consistent hashing, L4 vs L7 load balancers.', sort_order: 2 },
          { id: 'top-sd-caching', title: 'Caching Strategies', description: 'Write-through, write-behind, cache-aside, TTL, and eviction policies.', sort_order: 3 },
          { id: 'top-sd-databases', title: 'Database Selection', description: 'SQL vs NoSQL, CAP theorem, replication, sharding, and indexing.', sort_order: 4 },
        ],
      },
      {
        id: 'mod-sd-scenarios',
        title: 'Classic Design Scenarios',
        description: 'Practice designing real systems used by billions of people.',
        sort_order: 2,
        topics: [
          { id: 'top-sd-url', title: 'URL Shortener (TinyURL)', description: 'Key generation, base62 encoding, hot-key caching, and 301 vs 302 redirects.', sort_order: 1 },
          { id: 'top-sd-chat', title: 'Real-Time Chat (WhatsApp/Slack)', description: 'WebSockets, message ordering, presence, and fan-out patterns.', sort_order: 2 },
          { id: 'top-sd-feed', title: 'News Feed (Instagram/Twitter)', description: 'Fan-out on write vs read, ranking algorithms, and celebrity problem.', sort_order: 3 },
          { id: 'top-sd-kv', title: 'Distributed Key-Value Store', description: 'Consistent hashing, vector clocks, gossip protocol, and quorum reads.', sort_order: 4 },
        ],
      },
    ],
  },
];

// List all courses
courseRoutes.get('/', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, difficulty')
      .order('title');

    if (!error && data && data.length > 0) {
      res.json({ courses: data });
      return;
    }
  } catch {
    // Fallback to seed data
  }
  res.json({
    courses: SEED_COURSES.map(({ id, title, description, difficulty }) => ({
      id,
      title,
      description,
      difficulty,
    })),
  });
});

// Get a single course with its modules
courseRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, difficulty')
      .eq('id', req.params.id)
      .single();

    if (!courseError && course) {
      const { data: modules } = await supabase
        .from('modules')
        .select('id, title, description, sort_order')
        .eq('course_id', req.params.id)
        .order('sort_order');

      res.json({ ...course, modules: modules || [] });
      return;
    }
  } catch {
    // Fallback to seed data
  }

  const seedCourse = SEED_COURSES.find((c) => c.id === req.params.id);
  if (!seedCourse) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }
  res.json({
    id: seedCourse.id,
    title: seedCourse.title,
    description: seedCourse.description,
    difficulty: seedCourse.difficulty,
    modules: seedCourse.modules.map(({ id, title, description, sort_order }) => ({
      id,
      title,
      description,
      sort_order,
    })),
  });
});

// Get topics for a module
courseRoutes.get(
  '/:courseId/modules/:moduleId/topics',
  async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('topics')
        .select('id, title, description, sort_order')
        .eq('module_id', req.params.moduleId)
        .order('sort_order');

      if (!error && data && data.length > 0) {
        res.json({ topics: data });
        return;
      }
    } catch {
      // Fallback to seed data
    }

    // Seed fallback
    for (const course of SEED_COURSES) {
      if (course.id === req.params.courseId) {
        const mod = course.modules.find((m) => m.id === req.params.moduleId);
        if (mod) {
          res.json({ topics: mod.topics });
          return;
        }
      }
    }
    // Also search without courseId match (in case seed IDs don't have courseId in path)
    for (const course of SEED_COURSES) {
      const mod = course.modules.find((m) => m.id === req.params.moduleId);
      if (mod) {
        res.json({ topics: mod.topics });
        return;
      }
    }
    res.json({ topics: [] });
  }
);
