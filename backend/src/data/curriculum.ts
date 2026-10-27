/**
 * Canonical AlgoMentor curriculum.
 *
 * Single source of truth shared by the course/concept routes, the tutor
 * fallback, and the database seeding script. IDs are deterministic UUIDs so
 * upserts are idempotent and references stay stable across environments.
 *
 * The concept IDs in the `0001`–`0007` groups are already present in the live
 * database and carry real student progress — do not change them.
 */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CurriculumConcept {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  learningObjectives: string[];
}

export interface CurriculumTopic {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  concepts: CurriculumConcept[];
}

export interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  topics: CurriculumTopic[];
}

export interface CurriculumCourse {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  modules: CurriculumModule[];
}

export interface FlatConcept extends CurriculumConcept {
  topicId: string;
  topicTitle: string;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
}

function concept(
  id: string,
  name: string,
  description: string,
  difficulty: Difficulty,
  learningObjectives: string[]
): CurriculumConcept {
  return { id, name, description, difficulty, learningObjectives };
}

export const CURRICULUM_COURSES: CurriculumCourse[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'DSA Fundamentals',
    description:
      'Master the building blocks — complexity analysis, arrays, hash maps, linked lists, stacks, queues, and binary search. Every advanced pattern rests on these foundations.',
    difficulty: 'beginner',
    modules: [
      {
        id: '22222222-1111-1111-1111-111111111111',
        title: 'Foundations & Complexity',
        description: 'Asymptotic analysis and the core properties of arrays.',
        sortOrder: 1,
        topics: [
          {
            id: '33333333-1111-1111-1111-111111111111',
            title: 'Complexity Analysis',
            description:
              'Understanding asymptotic time and space complexity.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0001-0001-0001-000000000001',
                'Big-O Notation',
                'Understanding asymptotic upper bounds for algorithm performance.',
                'beginner',
                [
                  'Define Big-O notation',
                  'Identify common complexities: O(1), O(n), O(n²), O(log n)',
                  'Compare growth rates',
                ]
              ),
              concept(
                '44444444-0001-0001-0001-000000000002',
                'Logarithmic Complexity',
                'Understanding why halving operations lead to O(log n).',
                'beginner',
                [
                  'Explain why halving produces logarithmic growth',
                  'Calculate log₂ for powers of 2',
                  'Connect logarithms to divide-and-conquer',
                ]
              ),
            ],
          },
          {
            id: '33333333-2222-2222-2222-222222222222',
            title: 'Arrays & Strings',
            description:
              'Contiguous memory, prefix sums, sliding windows, and two pointers.',
            sortOrder: 2,
            concepts: [
              concept(
                '44444444-0002-0002-0002-000000000001',
                'Array Basics',
                'Contiguous memory, O(1) index access, iteration, and in-place manipulation.',
                'beginner',
                [
                  'Describe contiguous array memory representation and cache locality',
                  'Access and update elements by index in O(1)',
                  'Perform in-place operations without extra space allocation',
                ]
              ),
              concept(
                '44444444-0002-0002-0002-000000000002',
                'Sorted Arrays',
                'Properties and advantages of sorted data.',
                'beginner',
                [
                  'Explain what makes data sorted',
                  'Describe why sorted data enables faster search',
                  'Identify operations that maintain sorted order',
                ]
              ),
              concept(
                '44444444-0002-0002-0002-000000000003',
                'Prefix Sum & Difference Arrays',
                'Precomputing cumulative sums to answer range queries in O(1).',
                'beginner',
                [
                  'Construct a prefix sum array in O(n) time',
                  'Answer range sum queries in O(1): sum(i, j) = P[j] - P[i-1]',
                  'Extend prefix sums to 2D matrices and difference arrays',
                ]
              ),
              concept(
                '44444444-0002-0002-0002-000000000004',
                'Sliding Window',
                'Maintaining rolling state across a contiguous subarray to avoid O(n²) rescans.',
                'intermediate',
                [
                  'Recognize fixed-size vs dynamic-size window signatures',
                  'Formulate and maintain the window valid-state invariant',
                  'Optimize quadratic nested loops into O(n) amortized scans',
                ]
              ),
              concept(
                '44444444-0002-0002-0002-000000000005',
                'Two Pointer Convergence',
                'Converging or diverging pointers that eliminate impossible search states.',
                'beginner',
                [
                  'Identify sorted-data preconditions for opposite-end pointer convergence',
                  'Prove correctness by showing eliminated pairs cannot satisfy constraints',
                  'Distinguish colliding pointers from fast-slow directional pairs',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        title: 'Searching & Binary Search',
        description:
          'Linear search, classical binary search, and binary search on answer spaces.',
        sortOrder: 2,
        topics: [
          {
            id: '33333333-3333-3333-3333-333333333333',
            title: 'Linear Search',
            description: 'Sequential search techniques.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0003-0003-0003-000000000001',
                'Linear Search',
                'Sequential element-by-element search.',
                'beginner',
                [
                  'Implement linear search',
                  'Analyze O(n) complexity',
                  'Identify when linear search is appropriate',
                ]
              ),
            ],
          },
          {
            id: '33333333-4444-4444-4444-444444444444',
            title: 'Binary Search',
            description: 'Divide and conquer search on sorted data.',
            sortOrder: 2,
            concepts: [
              concept(
                '44444444-0004-0004-0004-000000000001',
                'Binary Search Algorithm',
                'Efficient search on sorted arrays by halving the search space.',
                'intermediate',
                [
                  'Explain the binary search invariant',
                  'Implement binary search without off-by-one errors',
                  'Analyze O(log n) complexity',
                ]
              ),
              concept(
                '44444444-0004-0004-0004-000000000002',
                'Search Space Reduction',
                'The principle of eliminating possibilities to narrow down a solution.',
                'beginner',
                [
                  'Explain search space reduction',
                  'Describe how binary search halves the search space',
                  'Apply the concept to novel problems',
                ]
              ),
              concept(
                '44444444-0004-0004-0004-000000000003',
                'Binary Search on Answer',
                'Transforming optimization problems into decision problems over a monotonic predicate.',
                'intermediate',
                [
                  'Identify monotonic feasibility predicates that flip from false to true',
                  'Define low and high bounds for the answer domain',
                  'Solve Koko Eating Bananas and Capacity To Ship Packages',
                ]
              ),
              concept(
                '44444444-0004-0004-0004-000000000004',
                'Rotated Sorted Array Search',
                'Exploiting the invariant that at least one half of a rotated array is sorted.',
                'intermediate',
                [
                  'Identify which half [low..mid] or [mid..high] is sorted',
                  'Determine whether the target lies inside the sorted half',
                  'Find the rotation pivot and handle duplicates',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-3333-3333-3333-000000000001',
        title: 'Hash Maps & Sets',
        description: 'O(1) lookups, frequency counting, and collision resolution.',
        sortOrder: 3,
        topics: [
          {
            id: '33333333-5555-5555-5555-000000000001',
            title: 'Hash Tables & Frequency Counting',
            description: 'Hashing internals and complement lookup patterns.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0005-0005-0005-000000000001',
                'Hash Tables & Collision Resolution',
                'Hash codes, buckets, load factor, chaining, and open addressing.',
                'beginner',
                [
                  'Explain uniform distribution requirements for hash functions',
                  'Compare separate chaining vs open addressing',
                  'Understand load factor thresholds and amortized resizing',
                ]
              ),
              concept(
                '44444444-0005-0005-0005-000000000002',
                'Frequency Counting & Complement Lookup',
                'Trading space for instantaneous lookup of complements and frequencies.',
                'beginner',
                [
                  'Transform O(n²) nested search into O(n) with complement caching',
                  'Use frequency maps for anagram detection and duplicates',
                  'Maintain rolling frequency maps inside sliding windows',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-3333-3333-3333-000000000002',
        title: 'Stacks & Queues',
        description: 'LIFO and FIFO structures with monotonic stack applications.',
        sortOrder: 4,
        topics: [
          {
            id: '33333333-5555-5555-5555-000000000002',
            title: 'LIFO, FIFO & Monotonic Patterns',
            description: 'Stack matching, monotonic stacks, and queue traversal.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0006-0006-0006-000000000001',
                'Stack & Matching Invariants',
                'LIFO discipline, bracket matching, and call stack mechanics.',
                'beginner',
                [
                  'Trace LIFO push/pop state transitions',
                  'Validate balanced nested structures',
                  'Relate explicit stacks to recursive execution frames',
                ]
              ),
              concept(
                '44444444-0006-0006-0006-000000000002',
                'Monotonic Stack',
                'Enforcing monotonic order to resolve next-greater queries in O(n).',
                'intermediate',
                [
                  'Maintain monotonic ordering during a linear traversal',
                  'Resolve pending candidates when the invariant is violated',
                  'Solve Next Greater Element, Daily Temperatures, and histogram area',
                ]
              ),
              concept(
                '44444444-0006-0006-0006-000000000003',
                'Queue & BFS Level Ordering',
                'FIFO buffering and guaranteed shortest-path exploration in unweighted graphs.',
                'beginner',
                [
                  'Trace FIFO queue mechanics',
                  'Implement level-by-level breadth-first traversal',
                  'Prove why BFS guarantees the shortest unweighted path',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-3333-3333-3333-000000000003',
        title: 'Linked Lists',
        description: 'Pointer manipulation, cycle detection, and reversal techniques.',
        sortOrder: 5,
        topics: [
          {
            id: '33333333-5555-5555-5555-000000000003',
            title: 'Pointer Manipulation & Cycle Detection',
            description: 'Node references, sentinels, reversal, and Floyd’s algorithm.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0007-0007-0007-000000000001',
                'Linked List Pointer Manipulation',
                'Non-contiguous nodes, dummy sentinels, and in-place reversal.',
                'beginner',
                [
                  'Draw pointer references without losing orphaned nodes',
                  'Use dummy head nodes to remove boundary edge cases',
                  'Reverse a singly linked list in-place with three pointers',
                ]
              ),
              concept(
                '44444444-0007-0007-0007-000000000002',
                'Floyd’s Cycle Finding',
                'Differential pointer velocities for cycle detection and midpoints.',
                'intermediate',
                [
                  'Prove why slow (1x) and fast (2x) pointers must meet inside a cycle',
                  'Locate the cycle entry node with Floyd’s phase 2 reset',
                  'Find a linked list middle node in a single traversal',
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    id: '11111111-2222-2222-2222-222222222222',
    title: 'Algorithmic Patterns',
    description:
      'The core patterns behind most interview problems — recursion, trees, graphs, dynamic programming, greedy, intervals, and heaps.',
    difficulty: 'intermediate',
    modules: [
      {
        id: '22222222-4444-4444-4444-000000000001',
        title: 'Recursion & Backtracking',
        description: 'Decision trees, subsets, permutations, and constraint pruning.',
        sortOrder: 1,
        topics: [
          {
            id: '33333333-6666-6666-6666-000000000001',
            title: 'Recursive Search Spaces',
            description: 'Base cases, recursion trees, and exhaustive generation.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0008-0008-0008-000000000001',
                'Recursion Fundamentals',
                'Base cases, the recursive leap of faith, and call stack mechanics.',
                'beginner',
                [
                  'Define base cases and recursive subproblems',
                  'Trace the call stack for simple recursions',
                  'Convert recursion to iteration when appropriate',
                ]
              ),
              concept(
                '44444444-0008-0008-0008-000000000002',
                'Subsets & Permutations',
                'Generating power sets and permutations with backtracking.',
                'intermediate',
                [
                  'Model include/exclude decisions as a recursion tree',
                  'Generate all subsets in O(2ⁿ) time',
                  'Generate permutations and deduplicate repeated elements',
                ]
              ),
              concept(
                '44444444-0008-0008-0008-000000000003',
                'Constraint Backtracking',
                'N-Queens, Sudoku, and word search with aggressive pruning.',
                'advanced',
                [
                  'Place constraints to prune invalid branches early',
                  'Solve N-Queens with column and diagonal sets',
                  'Analyze worst-case versus pruned search complexity',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-4444-4444-4444-000000000002',
        title: 'Trees & Graphs',
        description: 'DFS, BFS, tree traversals, graph modeling, and topological sort.',
        sortOrder: 2,
        topics: [
          {
            id: '33333333-6666-6666-6666-000000000002',
            title: 'Tree Traversal',
            description: 'Depth-first and breadth-first traversal strategies.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0009-0009-0009-000000000001',
                'Tree DFS & Post-Order Aggregation',
                'Recursive subtree traversal with top-down and bottom-up data flow.',
                'intermediate',
                [
                  'Differentiate pre-order, in-order, and post-order applications',
                  'Compute depth, balance invariants, and lowest common ancestor',
                  'Return aggregated subtree results from recursion',
                ]
              ),
              concept(
                '44444444-0009-0009-0009-000000000002',
                'Tree BFS & Level Ordering',
                'Queue-driven level traversal and minimum-depth computation.',
                'beginner',
                [
                  'Implement level-order traversal with a queue',
                  'Track level boundaries for level-specific aggregation',
                  'Find minimum depth and right-side views',
                ]
              ),
            ],
          },
          {
            id: '33333333-6666-6666-6666-000000000003',
            title: 'Graph Modeling',
            description: 'Adjacency lists, visited sets, and dependency ordering.',
            sortOrder: 2,
            concepts: [
              concept(
                '44444444-0009-0009-0009-000000000003',
                'Graph Modeling & Topological Sort',
                'Representing dependencies and ordering DAGs with Kahn’s algorithm.',
                'intermediate',
                [
                  'Construct adjacency lists and in-degree arrays',
                  'Execute Kahn’s BFS to produce topological orderings',
                  'Detect dependency cycles in directed graphs',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-4444-4444-4444-000000000003',
        title: 'Dynamic Programming',
        description: 'State design from 1D through 2D and space optimization.',
        sortOrder: 3,
        topics: [
          {
            id: '33333333-6666-6666-6666-000000000004',
            title: 'DP State Design',
            description: 'Recurrences, tabulation, and rolling-array optimization.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0010-0010-0010-000000000001',
                '1D Dynamic Programming',
                'Overlapping subproblems with memoization and bottom-up tabulation.',
                'intermediate',
                [
                  'Identify optimal substructure and overlapping subproblems',
                  'Formulate state dp[i] and base conditions',
                  'Optimize space from O(n) to O(1) rolling variables',
                ]
              ),
              concept(
                '44444444-0010-0010-0010-000000000002',
                '2D Dynamic Programming',
                'Multi-dimensional state tables for strings, grids, and knapsack.',
                'advanced',
                [
                  'Formulate 2D transitions based on neighboring states',
                  'Solve Longest Common Subsequence, Edit Distance, and Unique Paths',
                  'Optimize space with a 1D rolling buffer',
                ]
              ),
              concept(
                '44444444-0010-0010-0010-000000000003',
                'DP Optimization Patterns',
                'Kadane’s algorithm, interval DP, and bitmask DP.',
                'advanced',
                [
                  'Recognize maximum-subarray structure solved by Kadane’s algorithm',
                  'Model interval DP over split points',
                  'Represent subset state with bitmasks for small n',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-4444-4444-4444-000000000004',
        title: 'Greedy & Intervals',
        description: 'Greedy choice proofs, interval scheduling, and merging.',
        sortOrder: 4,
        topics: [
          {
            id: '33333333-6666-6666-6666-000000000005',
            title: 'Greedy Choice & Scheduling',
            description: 'Exchange arguments and sweep-line interval processing.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0011-0011-0011-000000000001',
                'Greedy Algorithms',
                'Proving local choices lead to global optima.',
                'intermediate',
                [
                  'Identify problems with the greedy choice property',
                  'Use exchange arguments to justify greedy choices',
                  'Solve Jump Game, gas station, and task scheduler',
                ]
              ),
              concept(
                '44444444-0011-0011-0011-000000000002',
                'Interval Problems',
                'Sorting, merging, and selecting non-overlapping intervals.',
                'intermediate',
                [
                  'Sort intervals by start or end depending on the goal',
                  'Merge overlapping intervals in O(n log n)',
                  'Solve insert interval and maximum non-overlapping intervals',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-4444-4444-4444-000000000005',
        title: 'Heaps & Priority Queues',
        description: 'Top-K selection, streaming medians, and K-way merging.',
        sortOrder: 5,
        topics: [
          {
            id: '33333333-6666-6666-6666-000000000006',
            title: 'Heap Patterns',
            description: 'Heap operations and bounded top-K selection.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0012-0012-0012-000000000001',
                'Heap Operations',
                'Min-heaps, max-heaps, heapify, and priority queue APIs.',
                'beginner',
                [
                  'Explain heap-index parent/child relationships',
                  'Perform push and pop in O(log n)',
                  'Build a heap in O(n) with heapify',
                ]
              ),
              concept(
                '44444444-0012-0012-0012-000000000002',
                'Top-K Pattern',
                'Bounded heaps for Kth largest and top-K frequent problems.',
                'intermediate',
                [
                  'Maintain a size-K heap for streaming selection',
                  'Solve Kth largest, top K frequent, and K closest points',
                  'Compare heap selection with quickselect trade-offs',
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    id: '11111111-3333-3333-3333-333333333333',
    title: 'System Design Fundamentals',
    description:
      'Design scalable distributed systems — from URL shorteners to real-time chat — with back-of-the-envelope math and trade-off analysis.',
    difficulty: 'advanced',
    modules: [
      {
        id: '22222222-5555-5555-5555-000000000001',
        title: 'System Design Foundations',
        description: 'Scaling, load balancing, caching, and database selection.',
        sortOrder: 1,
        topics: [
          {
            id: '33333333-7777-7777-7777-000000000001',
            title: 'Scalability & Routing',
            description: 'Stateless services, horizontal scaling, and traffic distribution.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0013-0013-0013-000000000001',
                'Stateless Horizontal Scaling',
                'Externalizing state so compute layers can scale horizontally.',
                'intermediate',
                [
                  'Identify single points of failure in monolithic architectures',
                  'Extract session state into caches and databases',
                  'Design health checks and autoscaling policies',
                ]
              ),
              concept(
                '44444444-0013-0013-0013-000000000002',
                'Load Balancing & Consistent Hashing',
                'L4 vs L7 routing and distributing keys without massive rehashing.',
                'advanced',
                [
                  'Compare Layer 4 TCP and Layer 7 HTTP load balancing',
                  'Explain consistent hashing rings and virtual nodes',
                  'Minimize key redistribution when nodes join or leave',
                ]
              ),
            ],
          },
          {
            id: '33333333-7777-7777-7777-000000000002',
            title: 'Caching & Data Stores',
            description: 'Cache strategies, eviction policies, and database trade-offs.',
            sortOrder: 2,
            concepts: [
              concept(
                '44444444-0013-0013-0013-000000000003',
                'Distributed Caching Strategies',
                'Cache-aside, write-through, TTL, and failure-mode mitigation.',
                'intermediate',
                [
                  'Evaluate cache-aside vs write-through trade-offs',
                  'Mitigate cache stampede, penetration, and avalanche failures',
                  'Select between LRU, LFU, and FIFO eviction',
                ]
              ),
              concept(
                '44444444-0013-0013-0013-000000000004',
                'Database Selection & CAP Theorem',
                'SQL vs NoSQL, consistency trade-offs, replication, and sharding.',
                'advanced',
                [
                  'Compare relational and NoSQL data models for a workload',
                  'Apply the CAP theorem to partition-tolerant designs',
                  'Choose replication and sharding strategies',
                ]
              ),
            ],
          },
        ],
      },
      {
        id: '22222222-5555-5555-5555-000000000002',
        title: 'Classic Design Scenarios',
        description: 'Practice designing systems used at massive scale.',
        sortOrder: 2,
        topics: [
          {
            id: '33333333-7777-7777-7777-000000000003',
            title: 'URL Shortener & Chat',
            description: 'Key generation, redirects, and real-time messaging.',
            sortOrder: 1,
            concepts: [
              concept(
                '44444444-0014-0014-0014-000000000001',
                'URL Shortener Architecture',
                'High-throughput short links with Base62 keys and redirect semantics.',
                'advanced',
                [
                  'Perform capacity estimates for storage and bandwidth',
                  'Generate unique 7-character Base62 keys without collisions',
                  'Evaluate 301 permanent vs 302 temporary redirect trade-offs',
                ]
              ),
              concept(
                '44444444-0014-0014-0014-000000000002',
                'Real-Time Chat Architecture',
                'WebSockets, message ordering, presence, and fan-out.',
                'advanced',
                [
                  'Choose WebSockets vs long polling for bidirectional messaging',
                  'Preserve per-conversation message ordering',
                  'Design presence tracking and offline delivery',
                ]
              ),
            ],
          },
          {
            id: '33333333-7777-7777-7777-000000000004',
            title: 'Feeds & Key-Value Stores',
            description: 'Fan-out strategies, ranking, and distributed storage.',
            sortOrder: 2,
            concepts: [
              concept(
                '44444444-0014-0014-0014-000000000003',
                'News Feed Fan-Out',
                'Fan-out on write vs read, ranking, and the celebrity problem.',
                'advanced',
                [
                  'Compare fan-out on write and fan-out on read',
                  'Design a hybrid strategy for high-follower accounts',
                  'Incorporate ranking signals into feed assembly',
                ]
              ),
              concept(
                '44444444-0014-0014-0014-000000000004',
                'Distributed Key-Value Store',
                'Consistent hashing, quorum reads/writes, and conflict resolution.',
                'advanced',
                [
                  'Design partitioning with consistent hashing',
                  'Configure quorum reads and writes for availability',
                  'Resolve concurrent updates with vector clocks or LWW',
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
];

// ─── Prerequisite graph ──────────────────────────────────────────────
//
// The first seven edges mirror the relationships already stored in the live
// database. They are re-upserted idempotently by the seeding script.

interface PrerequisiteEdge {
  source: string;
  target: string;
  type: 'prerequisite' | 'related';
}

const PREREQUISITE_EDGES: PrerequisiteEdge[] = [
  { source: '44444444-0001-0001-0001-000000000001', target: '44444444-0001-0001-0001-000000000002', type: 'prerequisite' },
  { source: '44444444-0002-0002-0002-000000000001', target: '44444444-0002-0002-0002-000000000002', type: 'prerequisite' },
  { source: '44444444-0002-0002-0002-000000000001', target: '44444444-0003-0003-0003-000000000001', type: 'prerequisite' },
  { source: '44444444-0002-0002-0002-000000000002', target: '44444444-0004-0004-0004-000000000001', type: 'prerequisite' },
  { source: '44444444-0004-0004-0004-000000000002', target: '44444444-0004-0004-0004-000000000001', type: 'prerequisite' },
  { source: '44444444-0001-0001-0001-000000000002', target: '44444444-0004-0004-0004-000000000001', type: 'prerequisite' },
  { source: '44444444-0002-0002-0002-000000000001', target: '44444444-0002-0002-0002-000000000003', type: 'prerequisite' },
  { source: '44444444-0002-0002-0002-000000000001', target: '44444444-0002-0002-0002-000000000004', type: 'prerequisite' },
  { source: '44444444-0002-0002-0002-000000000001', target: '44444444-0002-0002-0002-000000000005', type: 'prerequisite' },
  { source: '44444444-0004-0004-0004-000000000001', target: '44444444-0004-0004-0004-000000000003', type: 'prerequisite' },
  { source: '44444444-0004-0004-0004-000000000001', target: '44444444-0004-0004-0004-000000000004', type: 'prerequisite' },
  { source: '44444444-0005-0005-0005-000000000001', target: '44444444-0005-0005-0005-000000000002', type: 'prerequisite' },
  { source: '44444444-0002-0002-0002-000000000002', target: '44444444-0002-0002-0002-000000000005', type: 'prerequisite' },
  { source: '44444444-0006-0006-0006-000000000001', target: '44444444-0006-0006-0006-000000000002', type: 'prerequisite' },
  { source: '44444444-0007-0007-0007-000000000001', target: '44444444-0007-0007-0007-000000000002', type: 'prerequisite' },
  { source: '44444444-0008-0008-0008-000000000001', target: '44444444-0008-0008-0008-000000000002', type: 'prerequisite' },
  { source: '44444444-0008-0008-0008-000000000001', target: '44444444-0008-0008-0008-000000000003', type: 'prerequisite' },
  { source: '44444444-0008-0008-0008-000000000001', target: '44444444-0009-0009-0009-000000000001', type: 'prerequisite' },
  { source: '44444444-0009-0009-0009-000000000001', target: '44444444-0009-0009-0009-000000000002', type: 'prerequisite' },
  { source: '44444444-0008-0008-0008-000000000001', target: '44444444-0009-0009-0009-000000000003', type: 'prerequisite' },
  { source: '44444444-0010-0010-0010-000000000001', target: '44444444-0010-0010-0010-000000000002', type: 'prerequisite' },
  { source: '44444444-0010-0010-0010-000000000001', target: '44444444-0010-0010-0010-000000000003', type: 'prerequisite' },
  { source: '44444444-0012-0012-0012-000000000001', target: '44444444-0012-0012-0012-000000000002', type: 'prerequisite' },
  { source: '44444444-0013-0013-0013-000000000001', target: '44444444-0013-0013-0013-000000000002', type: 'prerequisite' },
  { source: '44444444-0013-0013-0013-000000000001', target: '44444444-0013-0013-0013-000000000003', type: 'prerequisite' },
  { source: '44444444-0013-0013-0013-000000000003', target: '44444444-0014-0014-0014-000000000001', type: 'prerequisite' },
  { source: '44444444-0013-0013-0013-000000000001', target: '44444444-0014-0014-0014-000000000002', type: 'prerequisite' },
  { source: '44444444-0013-0013-0013-000000000003', target: '44444444-0014-0014-0014-000000000003', type: 'prerequisite' },
  { source: '44444444-0013-0013-0013-000000000003', target: '44444444-0014-0014-0014-000000000004', type: 'prerequisite' },
  { source: '44444444-0003-0003-0003-000000000001', target: '44444444-0004-0004-0004-000000000001', type: 'related' },
];

// ─── Flat indexes ────────────────────────────────────────────────────

export const CURRICULUM_MODULES = CURRICULUM_COURSES.flatMap((course) =>
  course.modules.map((mod) => ({
    id: mod.id,
    courseId: course.id,
    title: mod.title,
    description: mod.description,
    sortOrder: mod.sortOrder,
    topics: mod.topics,
  }))
);

export const CURRICULUM_TOPICS = CURRICULUM_MODULES.flatMap((mod) =>
  mod.topics.map((topic) => ({
    id: topic.id,
    moduleId: mod.id,
    title: topic.title,
    description: topic.description,
    sortOrder: topic.sortOrder,
    concepts: topic.concepts,
  }))
);

export const CURRICULUM_CONCEPTS: FlatConcept[] = CURRICULUM_COURSES.flatMap((course) =>
  course.modules.flatMap((mod) =>
    mod.topics.flatMap((topic) =>
      topic.concepts.map((c) => ({
        ...c,
        topicId: topic.id,
        topicTitle: topic.title,
        moduleId: mod.id,
        moduleTitle: mod.title,
        courseId: course.id,
        courseTitle: course.title,
      }))
    )
  )
);

const COURSE_INDEX = new Map(CURRICULUM_COURSES.map((c, i) => [c.id, i]));
const MODULE_INDEX = new Map(CURRICULUM_MODULES.map((m) => [m.id, m]));
const TOPIC_INDEX = new Map(CURRICULUM_TOPICS.map((t) => [t.id, t]));
const CONCEPT_INDEX = new Map(CURRICULUM_CONCEPTS.map((c) => [c.id, c]));

export function getCurriculumCourse(id: string): CurriculumCourse | undefined {
  return CURRICULUM_COURSES.find((c) => c.id === id);
}

export function getCurriculumModules(courseId: string) {
  return CURRICULUM_MODULES.filter((m) => m.courseId === courseId).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

export function getCurriculumModule(id: string) {
  return MODULE_INDEX.get(id);
}

export function getCurriculumTopics(moduleId: string) {
  return CURRICULUM_TOPICS.filter((t) => t.moduleId === moduleId).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

export function getCurriculumTopic(id: string) {
  return TOPIC_INDEX.get(id);
}

export function getCurriculumConceptsForTopic(topicId: string): FlatConcept[] {
  return CURRICULUM_CONCEPTS.filter((c) => c.topicId === topicId);
}

export function getCurriculumConcept(id: string): FlatConcept | undefined {
  return CONCEPT_INDEX.get(id);
}

export function getCurriculumPrerequisites(id: string): FlatConcept[] {
  return PREREQUISITE_EDGES.filter((e) => e.target === id && e.type === 'prerequisite')
    .map((e) => CONCEPT_INDEX.get(e.source))
    .filter((c): c is FlatConcept => Boolean(c));
}

export function getCurriculumCourseOrder(courseId: string): number {
  return COURSE_INDEX.get(courseId) ?? Number.MAX_SAFE_INTEGER;
}

export function getPrerequisiteEdges(): PrerequisiteEdge[] {
  return PREREQUISITE_EDGES;
}

export const CURRICULUM_COUNTS = {
  courses: CURRICULUM_COURSES.length,
  modules: CURRICULUM_MODULES.length,
  topics: CURRICULUM_TOPICS.length,
  concepts: CURRICULUM_CONCEPTS.length,
  relationships: PREREQUISITE_EDGES.length,
};
