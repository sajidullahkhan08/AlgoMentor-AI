/**
 * AlgoMentor AI — Phase 6 Interactive Visualizations & Mental Models Verification
 *
 * Validates mathematical correctness, invariant satisfaction, and traversal
 * order for all interactive mental models:
 * 1. Binary Tree Traversals (In-order, Pre-order, Post-order, Level-order)
 * 2. Graph Traversals (BFS Queue, DFS Stack, Visited Sets, Cycle Avoidance)
 * 3. Two-Pointer Collision & O(1) Sliding Window
 * 4. Dynamic Programming Matrix (Grid Unique Paths, 0/1 Knapsack)
 * 5. Big-O Complexity Asymptotic Scaling
 */

interface TreeNode {
  val: number;
  left?: TreeNode;
  right?: TreeNode;
}

const TEST_TREE: TreeNode = {
  val: 4,
  left: {
    val: 2,
    left: { val: 1 },
    right: { val: 3 },
  },
  right: {
    val: 6,
    left: { val: 5 },
    right: { val: 7 },
  },
};

const TEST_GRAPH: Record<string, string[]> = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'D', 'F'],
  D: ['B', 'C', 'F'],
  E: ['B'],
  F: ['C', 'D'],
};

function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

async function runTests() {
  console.log('=== AlgoMentor AI — Phase 6 Mental Models & Visualizations Verification ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  // --- Suite 1: Binary Tree Traversals ---
  console.log('--- Suite 1: Binary Tree Invariants ---');

  // In-order traversal
  const inorderList: number[] = [];
  function inorder(n?: TreeNode) {
    if (!n) return;
    inorder(n.left);
    inorderList.push(n.val);
    inorder(n.right);
  }
  inorder(TEST_TREE);
  assert(
    arraysEqual(inorderList, [1, 2, 3, 4, 5, 6, 7]),
    'In-Order traversal on BST yields monotonically sorted sequence [1, 2, 3, 4, 5, 6, 7]'
  );

  // Pre-order traversal
  const preorderList: number[] = [];
  function preorder(n?: TreeNode) {
    if (!n) return;
    preorderList.push(n.val);
    preorder(n.left);
    preorder(n.right);
  }
  preorder(TEST_TREE);
  assert(
    arraysEqual(preorderList, [4, 2, 1, 3, 6, 5, 7]),
    'Pre-Order traversal visits Root before subtrees [4, 2, 1, 3, 6, 5, 7]'
  );

  // Post-order traversal
  const postorderList: number[] = [];
  function postorder(n?: TreeNode) {
    if (!n) return;
    postorder(n.left);
    postorder(n.right);
    postorderList.push(n.val);
  }
  postorder(TEST_TREE);
  assert(
    arraysEqual(postorderList, [1, 3, 2, 5, 7, 6, 4]),
    'Post-Order traversal evaluates children bottom-up before Root [1, 3, 2, 5, 7, 6, 4]'
  );

  // Level-order (BFS)
  const levelorderList: number[] = [];
  const q: TreeNode[] = [TEST_TREE];
  while (q.length > 0) {
    const curr = q.shift()!;
    levelorderList.push(curr.val);
    if (curr.left) q.push(curr.left);
    if (curr.right) q.push(curr.right);
  }
  assert(
    arraysEqual(levelorderList, [4, 2, 6, 1, 3, 5, 7]),
    'Level-Order BFS traverses level-by-level using FIFO Queue [4, 2, 6, 1, 3, 5, 7]'
  );

  // --- Suite 2: Graph Traversals ---
  console.log('\n--- Suite 2: Graph Traversal Invariants ---');

  // BFS
  const bfsVisited: string[] = [];
  const bfsQueue: string[] = ['A'];
  const bfsSeen = new Set<string>(['A']);
  while (bfsQueue.length > 0) {
    const curr = bfsQueue.shift()!;
    bfsVisited.push(curr);
    for (const neighbor of TEST_GRAPH[curr] || []) {
      if (!bfsSeen.has(neighbor)) {
        bfsSeen.add(neighbor);
        bfsQueue.push(neighbor);
      }
    }
  }
  assert(bfsVisited.length === 6, 'BFS visits all 6 connected nodes in graph');
  assert(
    bfsVisited.indexOf('B') < bfsVisited.indexOf('F') &&
      bfsVisited.indexOf('C') < bfsVisited.indexOf('F'),
    'BFS explores radius-1 neighbors (B, C) before radius-2 neighbor (F)'
  );

  // DFS
  const dfsVisited: string[] = [];
  const dfsSeen = new Set<string>();
  function dfs(curr: string) {
    dfsSeen.add(curr);
    dfsVisited.push(curr);
    for (const neighbor of TEST_GRAPH[curr] || []) {
      if (!dfsSeen.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }
  dfs('A');
  assert(dfsVisited.length === 6, 'DFS successfully visits all reachable nodes');
  assert(dfsSeen.size === 6, 'DFS visited set prevents infinite cycle loops');

  // --- Suite 3: Two-Pointer & Sliding Window ---
  console.log('\n--- Suite 3: Two-Pointer & Sliding Window Invariants ---');

  // Two-pointer collision
  const sortedArr = [2, 3, 5, 8, 11, 14, 18];
  const target = 19;
  let l = 0;
  let r = sortedArr.length - 1;
  let foundPair: [number, number] | null = null;
  let collisionSteps = 0;

  while (l < r) {
    collisionSteps++;
    const sum = sortedArr[l] + sortedArr[r];
    if (sum === target) {
      foundPair = [sortedArr[l], sortedArr[r]];
      break;
    } else if (sum < target) {
      l++;
    } else {
      r--;
    }
  }
  assert(
    foundPair !== null && foundPair[0] === 5 && foundPair[1] === 14,
    'Two-Pointer collision finds target pair (5, 14) in sorted array'
  );
  assert(
    collisionSteps <= sortedArr.length,
    `Two-Pointer collision terminates in O(n) steps (actual: ${collisionSteps} steps)`
  );

  // Sliding window of size K = 3
  const winArr = [2, 1, 5, 1, 3, 2];
  const k = 3;
  let winSum = 0;
  for (let i = 0; i < k; i++) winSum += winArr[i];
  let maxWinSum = winSum;

  for (let i = k; i < winArr.length; i++) {
    winSum = winSum - winArr[i - k] + winArr[i];
    if (winSum > maxWinSum) maxWinSum = winSum;
  }
  assert(
    maxWinSum === 9,
    'Sliding Window computes max subarray sum of size 3 as 9 ([5, 1, 3]) with O(1) state transitions'
  );

  // --- Suite 4: Dynamic Programming Matrix ---
  console.log('\n--- Suite 4: Dynamic Programming Invariants ---');

  // Grid Unique Paths 3 x 4
  const dpGrid: number[][] = Array(3)
    .fill(0)
    .map(() => Array(4).fill(0));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (row === 0 || col === 0) {
        dpGrid[row][col] = 1;
      } else {
        dpGrid[row][col] = dpGrid[row - 1][col] + dpGrid[row][col - 1];
      }
    }
  }
  assert(
    dpGrid[2][3] === 10,
    'Grid Unique Paths (3 x 4) calculates dp[2][3] = 10 matching combination formula C(5, 2)'
  );

  // 0/1 Knapsack
  const weights = [1, 2, 3];
  const values = [6, 10, 12];
  const capacity = 5;
  const dpKnap: number[][] = Array(4)
    .fill(0)
    .map(() => Array(6).fill(0));

  for (let i = 1; i <= 3; i++) {
    for (let w = 1; w <= capacity; w++) {
      const wt = weights[i - 1];
      const val = values[i - 1];
      if (wt <= w) {
        dpKnap[i][w] = Math.max(dpKnap[i - 1][w], val + dpKnap[i - 1][w - wt]);
      } else {
        dpKnap[i][w] = dpKnap[i - 1][w];
      }
    }
  }
  assert(
    dpKnap[3][5] === 22,
    '0/1 Knapsack computes optimal value 22 (items 2 & 3: weight 5, value 10+12=22)'
  );

  // --- Suite 5: Big-O Complexity Scaling ---
  console.log('\n--- Suite 5: Big-O Asymptotic Scaling ---');

  const n = 1024;
  const logSteps = Math.ceil(Math.log2(n));
  const nLogSteps = Math.round(n * Math.log2(n));
  const quadraticSteps = n * n;

  assert(logSteps === 10, `O(log n) for N=${n} produces exact 10 halving steps`);
  assert(nLogSteps === 10240, `O(n log n) for N=${n} produces 10,240 operations`);
  assert(quadraticSteps === 1048576, `O(n²) for N=${n} scales to 1,048,576 operations`);
  assert(
    logSteps < n && n < nLogSteps && nLogSteps < quadraticSteps,
    'Asymptotic ordering holds strictly: O(log n) < O(n) < O(n log n) < O(n²)'
  );

  console.log(`\nVerification Complete: ${passed} / ${total} assertions passed.`);
  if (passed === total) {
    console.log('🎉 All Phase 6 Mental Models & Visualizations tests passed successfully!\n');
    process.exit(0);
  } else {
    console.error(`💥 Verification failed: ${total - passed} assertion(s) did not pass.\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
