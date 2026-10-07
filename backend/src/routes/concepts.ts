/**
 * Concept routes.
 *
 * Provides concept detail and prerequisite browsing:
 * - GET /concepts/topic/:topicId — list concepts for a topic (with seed fallback)
 * - GET /concepts/:id — get a single concept (with seed fallback)
 * - GET /concepts/:id/prerequisites — get prerequisite concepts (with seed fallback)
 */

import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/supabase';

export const conceptRoutes = Router();

// ─── Seed Concepts Registry (AlgoMaster-inspired Curriculum) ─────────

export interface SeedConcept {
  id: string;
  topic_id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learning_objectives: string[];
  prerequisite_ids?: string[];
}

export const SEED_CONCEPTS: SeedConcept[] = [
  // --- Arrays & Strings ---
  {
    id: '44444444-0002-0002-0002-000000000001',
    topic_id: 'top-array-basics',
    name: 'Array Memory & Indexing',
    description: 'Contiguous memory layout, cache locality, and O(1) index-based access.',
    difficulty: 'beginner',
    learning_objectives: [
      'Describe contiguous array memory representation and cache line advantages',
      'Perform in-place operations without extra space allocation',
      'Analyze O(1) indexing vs O(n) insertions/deletions',
    ],
  },
  {
    id: '44444444-0002-0002-0002-000000000003',
    topic_id: 'top-prefix-sum',
    name: 'Prefix Sum Invariants',
    description: 'Precomputing cumulative sums to answer range query sums in O(1) time.',
    difficulty: 'beginner',
    learning_objectives: [
      'Construct a prefix sum array in O(n) time',
      'Answer arbitrary range sum queries in O(1) time: sum(i, j) = P[j] - P[i-1]',
      'Extend prefix sums to 2D matrices and difference arrays for range updates',
    ],
    prerequisite_ids: ['44444444-0002-0002-0002-000000000001'],
  },
  {
    id: '44444444-0002-0002-0002-000000000004',
    topic_id: 'top-sliding-window',
    name: 'Sliding Window Invariant',
    description: 'Maintaining a rolling state across a contiguous subarray to avoid redundant O(n²) scans.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Recognize fixed-size vs dynamic-size window problem signatures',
      'Formulate and maintain the window valid-state invariant',
      'Optimize quadratic nested loops into O(n) amortized linear scans',
    ],
    prerequisite_ids: ['44444444-0002-0002-0002-000000000001'],
  },
  {
    id: '44444444-0002-0002-0002-000000000005',
    topic_id: 'top-two-pointers',
    name: 'Two Pointer Convergence',
    description: 'Converging or diverging pointers on sorted sequences to eliminate impossible search states.',
    difficulty: 'beginner',
    learning_objectives: [
      'Identify sorted-data preconditions for opposite-end pointer convergence',
      'Prove correctness by showing eliminated candidate pairs cannot satisfy constraints',
      'Distinguish colliding pointers from fast-slow directional pointer pairs',
    ],
    prerequisite_ids: ['44444444-0002-0002-0002-000000000001'],
  },

  // --- Hash Maps & Sets ---
  {
    id: '44444444-0005-0005-0005-000000000001',
    topic_id: 'top-hash-basics',
    name: 'Hash Tables & Collision Resolution',
    description: 'Under the hood of hash tables: hash codes, buckets, load factor, and chaining vs open addressing.',
    difficulty: 'beginner',
    learning_objectives: [
      'Explain hash function uniform distribution requirements',
      'Compare collision resolution strategies: separate chaining vs linear probing',
      'Understand load factor thresholds and table resizing cost amortization',
    ],
  },
  {
    id: '44444444-0005-0005-0005-000000000002',
    topic_id: 'top-freq-counting',
    name: 'Frequency Counting & Complement Lookup',
    description: 'Trading space for instantaneous lookup of complements and character frequencies.',
    difficulty: 'beginner',
    learning_objectives: [
      'Transform O(n²) nested search into O(n) single pass with complement caching',
      'Use frequency arrays / hash maps for anagram detection and duplicate tracking',
      'Manage rolling frequency maps within dynamic sliding windows',
    ],
    prerequisite_ids: ['44444444-0005-0005-0005-000000000001'],
  },

  // --- Stacks & Queues ---
  {
    id: '44444444-0006-0006-0006-000000000001',
    topic_id: 'top-stack-basics',
    name: 'LIFO Stack & Matching Invariants',
    description: 'Last-In First-Out data discipline, bracket matching, and call stack mechanics.',
    difficulty: 'beginner',
    learning_objectives: [
      'Trace LIFO push/pop state transitions',
      'Validate balanced nested structures (parentheses, tags, expressions)',
      'Relate explicit stacks to recursive function execution frames',
    ],
  },
  {
    id: '44444444-0006-0006-0006-000000000002',
    topic_id: 'top-monotonic-stack',
    name: 'Monotonic Stack Invariant',
    description: 'Enforcing strictly increasing or decreasing elements to find Next Greater Elements in O(n).',
    difficulty: 'intermediate',
    learning_objectives: [
      'Maintain monotonic ordering invariant during linear array traversal',
      'Resolve pending candidate elements immediately upon encountering violation',
      'Solve Next Greater Element, Daily Temperatures, and largest histogram rectangles',
    ],
    prerequisite_ids: ['44444444-0006-0006-0006-000000000001'],
  },
  {
    id: '44444444-0006-0006-0006-000000000003',
    topic_id: 'top-queue-bfs',
    name: 'FIFO Queue & BFS Level Ordering',
    description: 'First-In First-Out buffering and guaranteed shortest-path exploration in unweighted graphs.',
    difficulty: 'beginner',
    learning_objectives: [
      'Trace FIFO queue mechanics and queue buffer sizing',
      'Implement level-by-level breadth-first search traversals',
      'Prove why BFS guarantees the shortest unweighted path',
    ],
  },

  // --- Linked Lists ---
  {
    id: '44444444-0007-0007-0007-000000000001',
    topic_id: 'top-ll-basics',
    name: 'Linked List Pointer Manipulation',
    description: 'Non-contiguous memory node referencing, dummy head sentinels, and in-place reversal.',
    difficulty: 'beginner',
    learning_objectives: [
      'Draw pointer references to avoid losing track of orphaned nodes',
      'Use dummy head nodes to eliminate null-pointer edge cases at list boundaries',
      'Reverse singly linked lists in-place using three pointers (prev, curr, next)',
    ],
  },
  {
    id: '44444444-0007-0007-0007-000000000002',
    topic_id: 'top-ll-fast-slow',
    name: 'Floyd\'s Cycle Finding & Two-Speed Pointers',
    description: 'Using differential pointer velocities to detect cycles and identify list midpoints.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Prove mathematically why slow (1x) and fast (2x) pointers must meet inside a cycle',
      'Locate cycle entry node using Floyd\'s phase 2 reset algorithm',
      'Find linked list middle node in a single traversal',
    ],
    prerequisite_ids: ['44444444-0007-0007-0007-000000000001'],
  },

  // --- Binary Search ---
  {
    id: '44444444-0004-0004-0004-000000000001',
    topic_id: 'top-bs-classic',
    name: 'Binary Search Algorithm',
    description: 'Efficient search on sorted arrays by halving the search space every iteration.',
    difficulty: 'beginner',
    learning_objectives: [
      'Maintain the loop invariant: target lies within [low, high] if present',
      'Avoid 32-bit integer overflow using low + Math.floor((high - low) / 2)',
      'Analyze O(log n) time complexity from repeated halving',
    ],
  },
  {
    id: '44444444-0004-0004-0004-000000000003',
    topic_id: 'top-bs-on-answer',
    name: 'Binary Search on Monotonic Answer Space',
    description: 'Transforming optimization problems into decision problems over a monotonic feasibility function.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Identify monotonic feasibility predicates check(x) that flip from false to true',
      'Define low and high search bounds for the answer domain',
      'Solve Koko Eating Bananas and Capacity To Ship Packages in O(n log(max - min))',
    ],
    prerequisite_ids: ['44444444-0004-0004-0004-000000000001'],
  },
  {
    id: '44444444-0004-0004-0004-000000000004',
    topic_id: 'top-bs-rotated',
    name: 'Rotated Sorted Array Search',
    description: 'Exploiting the invariant that at least one half of a rotated array is always sorted.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Identify which half [low..mid] or [mid..high] is normally sorted',
      'Determine whether target lies inside the sorted half using boundary checks',
      'Find the rotation pivot and handle duplicates',
    ],
    prerequisite_ids: ['44444444-0004-0004-0004-000000000001'],
  },

  // --- Dynamic Programming ---
  {
    id: '44444444-0010-0010-0010-000000000001',
    topic_id: 'top-dp-1d',
    name: '1D Dynamic Programming & State Recurrence',
    description: 'Breaking problems into overlapping subproblems with memoization and bottom-up tabulation.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Identify optimal substructure and overlapping subproblems',
      'Formulate state definition dp[i] and base conditions',
      'Optimize space from O(n) array to O(1) rolling variables',
    ],
  },
  {
    id: '44444444-0010-0010-0010-000000000002',
    topic_id: 'top-dp-2d',
    name: '2D Dynamic Programming on Grids & Strings',
    description: 'Multi-dimensional state tables for string matching, grid path finding, and knapsack.',
    difficulty: 'advanced',
    learning_objectives: [
      'Formulate 2D state transitions: dp[i][j] based on neighbors',
      'Solve Longest Common Subsequence, Edit Distance, and Unique Paths',
      'Optimize space using 1D rolling buffer rows',
    ],
    prerequisite_ids: ['44444444-0010-0010-0010-000000000001'],
  },

  // --- Trees & Graphs ---
  {
    id: '44444444-0009-0009-0009-000000000001',
    topic_id: 'top-tree-dfs',
    name: 'Tree DFS & Post-Order Aggregation',
    description: 'Recursive subtree traversal, top-down parameter passing, and bottom-up result aggregation.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Differentiate Pre-Order, In-Order, and Post-Order applications',
      'Compute tree depth, balance invariants, and Lowest Common Ancestor (LCA)',
      'Manage global return variables vs returning aggregated subtree tuples',
    ],
  },
  {
    id: '44444444-0009-0009-0009-000000000003',
    topic_id: 'top-graph-modeling',
    name: 'Graph Modeling & Topological Sort',
    description: 'Representing dependencies via adjacency lists and ordering DAGs with Kahn\'s algorithm.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Construct adjacency lists and calculate in-degree arrays',
      'Execute Kahn\'s BFS algorithm to produce valid topological orderings',
      'Detect directed graph dependency cycles',
    ],
  },

  // --- System Design ---
  {
    id: '44444444-0013-0013-0013-000000000001',
    topic_id: 'top-sd-scaling',
    name: 'Stateless Horizontal Scaling',
    description: 'Architecting stateless compute layers, externalizing sessions, and auto-scaling horizontally.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Identify single points of failure in monolithic architectures',
      'Extract state into distributed caches and databases to allow horizontal scaling',
      'Design health check probes and autoscaling policies',
    ],
  },
  {
    id: '44444444-0013-0013-0013-000000000002',
    topic_id: 'top-sd-lb',
    name: 'Load Balancing & Consistent Hashing',
    description: 'L4 vs L7 routing, health checks, and distributing keys without massive rehashing.',
    difficulty: 'advanced',
    learning_objectives: [
      'Compare Layer 4 TCP vs Layer 7 HTTP application load balancing',
      'Explain consistent hashing hash rings and virtual nodes',
      'Minimize cache key redistribution when nodes join or leave clusters',
    ],
  },
  {
    id: '44444444-0013-0013-0013-000000000003',
    topic_id: 'top-sd-caching',
    name: 'Distributed Caching Strategies',
    description: 'Cache-aside, write-through, write-behind, TTL, and cache breakdown prevention.',
    difficulty: 'intermediate',
    learning_objectives: [
      'Evaluate cache-aside vs write-through tradeoffs',
      'Mitigate cache stampede, penetration, and avalanche failures',
      'Select between LRU, LFU, and FIFO eviction algorithms',
    ],
  },
  {
    id: '44444444-0014-0014-0014-000000000001',
    topic_id: 'top-sd-url',
    name: 'URL Shortener (TinyURL) Architecture',
    description: 'High-throughput URL shortener design with Base62 encoding and 301 vs 302 redirects.',
    difficulty: 'advanced',
    learning_objectives: [
      'Perform back-of-the-envelope capacity estimations for storage and bandwidth',
      'Generate unique 7-character Base62 keys without collisions',
      'Evaluate 301 Permanent vs 302 Temporary redirect impacts on analytics and cache',
    ],
    prerequisite_ids: ['44444444-0013-0013-0013-000000000001', '44444444-0013-0013-0013-000000000003'],
  },
];

// Helper to look up seed concepts
function getSeedConceptsForTopic(topicId: string): SeedConcept[] {
  return SEED_CONCEPTS.filter((c) => c.topic_id === topicId);
}

function getSeedConceptById(id: string): SeedConcept | undefined {
  return SEED_CONCEPTS.find((c) => c.id === id);
}

// ─── Routes ──────────────────────────────────────────────────────────

// List concepts for a topic
conceptRoutes.get('/topic/:topicId', async (req: Request, res: Response) => {
  const topicId = String(req.params.topicId);
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('concepts')
      .select('id, name, description, difficulty')
      .eq('topic_id', topicId)
      .order('name');

    if (!error && data && data.length > 0) {
      res.json({ concepts: data });
      return;
    }
  } catch {
    // Fallback to seed data
  }

  const seed = getSeedConceptsForTopic(topicId);
  res.json({
    concepts: seed.map(({ id, name, description, difficulty }) => ({
      id,
      name,
      description,
      difficulty,
    })),
  });
});

// Get a single concept
conceptRoutes.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('concepts')
      .select('id, name, description, difficulty, learning_objectives')
      .eq('id', id)
      .single();

    if (!error && data) {
      res.json(data);
      return;
    }
  } catch {
    // Fallback to seed data
  }

  const seed = getSeedConceptById(id);
  if (seed) {
    res.json({
      id: seed.id,
      name: seed.name,
      description: seed.description,
      difficulty: seed.difficulty,
      learning_objectives: seed.learning_objectives,
    });
    return;
  }

  res.status(404).json({ error: 'Concept not found' });
});

// Get prerequisite concepts
conceptRoutes.get('/:id/prerequisites', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const supabase = getSupabase();
    const { data: rels, error: relsError } = await supabase
      .from('concept_relationships')
      .select('source_concept_id')
      .eq('target_concept_id', id)
      .eq('relationship_type', 'prerequisite');

    if (!relsError && rels && rels.length > 0) {
      const prereqIds = rels.map((r) => r.source_concept_id);
      const { data: concepts, error: conceptsError } = await supabase
        .from('concepts')
        .select('id, name, description, difficulty')
        .in('id', prereqIds);

      if (!conceptsError && concepts) {
        res.json({ prerequisites: concepts });
        return;
      }
    }
  } catch {
    // Fallback to seed data
  }

  const seed = getSeedConceptById(id);
  if (seed && seed.prerequisite_ids && seed.prerequisite_ids.length > 0) {
    const prereqs = seed.prerequisite_ids
      .map((pId) => getSeedConceptById(pId))
      .filter((c): c is SeedConcept => Boolean(c))
      .map(({ id: pId, name, description, difficulty }) => ({
        id: pId,
        name,
        description,
        difficulty,
      }));
    res.json({ prerequisites: prereqs });
    return;
  }

  res.json({ prerequisites: [] });
});
