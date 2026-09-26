import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

interface VisualizerCardItem {
  id: string;
  type: 'tree' | 'graph' | 'array_search' | 'two_pointers' | 'dp_matrix' | 'complexity';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  keyConcepts: string[];
}

const VISUALIZERS: VisualizerCardItem[] = [
  {
    id: 'tree',
    type: 'tree',
    title: 'Binary Tree Traversals',
    subtitle: 'Pre-Order, In-Order, Post-Order & Level-Order BFS',
    badge: 'Trees & Recursion',
    badgeColor: '#10b981',
    description:
      'Step through recursive subtree traversal order and watch the LIFO Call Stack and FIFO Queue process nodes in real time.',
    keyConcepts: ['Call Stack', 'Sorted BST Property', 'Bottom-Up Height', 'FIFO Queue'],
  },
  {
    id: 'graph',
    type: 'graph',
    title: 'Graph BFS & DFS Traversals',
    subtitle: 'Frontier Expansion & Cycle Avoidance',
    badge: 'Graph Algorithms',
    badgeColor: '#f59e0b',
    description:
      'Visualize unweighted shortest path search via Queue (BFS) versus branch-deep exploration via Call Stack (DFS).',
    keyConcepts: ['Visited Set', 'Frontier Queue', 'Backtracking Stack', 'O(V + E)'],
  },
  {
    id: 'two_pointers',
    type: 'two_pointers',
    title: 'Two-Pointers & Sliding Window',
    subtitle: 'Collision Invariants & O(1) Window Sliding',
    badge: 'Array Patterns',
    badgeColor: '#38bdf8',
    description:
      'Observe left/right pointers meeting in sorted arrays, and observe sliding window sum adjustments in constant time.',
    keyConcepts: ['Search Space Elimination', 'Window [L..R]', 'Linear Scan Avoidance'],
  },
  {
    id: 'array_search',
    type: 'array_search',
    title: 'Binary Search Invariant Tracer',
    subtitle: 'Search Space Halving [L, M, R]',
    badge: 'Searching',
    badgeColor: '#6366f1',
    description:
      'Watch pointers L, M, and R halve the active search space on sorted arrays in logarithmic time O(log n).',
    keyConcepts: ['L <= R Invariant', 'Mid Calculation', 'Boundary Shift'],
  },
  {
    id: 'dp_matrix',
    type: 'dp_matrix',
    title: 'Dynamic Programming Matrix',
    subtitle: 'Overlapping Subproblems & Memoized State',
    badge: 'Dynamic Programming',
    badgeColor: '#ec4899',
    description:
      'Inspect 2D DP grids for Grid Unique Paths and 0/1 Knapsack. See how base cases feed subsequent cell computations.',
    keyConcepts: ['Recurrence Relation', 'State Memoization', 'Base Cases', 'O(M·N)'],
  },
  {
    id: 'complexity',
    type: 'complexity',
    title: 'Big-O Complexity Simulator',
    subtitle: 'Real-time N Operational Scaling & CPU Time',
    badge: 'Complexity Analysis',
    badgeColor: '#a855f7',
    description:
      'Adjust input size N to compare O(1), O(log n), O(n), O(n log n), O(n²), and explosive O(2ⁿ) execution curves.',
    keyConcepts: ['Asymptotic Growth', 'Time Limit Exceeded', 'Space Bounds'],
  },
];

export default function VisualizersIndexScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mental Models & Visualizers</Text>
          <Text style={styles.headerSubtitle}>
            Interactive algorithmic diagrams built to make internal invariants tangible and memorable
          </Text>
        </View>

        {/* Visualizer Cards */}
        <View style={styles.list}>
          {VISUALIZERS.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/(main)/visualizers/[type]',
                  params: { type: v.type },
                } as any)
              }
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.badge,
                    {
                      borderColor: v.badgeColor,
                      backgroundColor: `${v.badgeColor}15`,
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: v.badgeColor }]}>
                    {v.badge}
                  </Text>
                </View>
                <Text style={styles.cardArrow}>Explore ➔</Text>
              </View>

              <Text style={styles.cardTitle}>{v.title}</Text>
              <Text style={styles.cardSubtitle}>{v.subtitle}</Text>
              <Text style={styles.cardDesc}>{v.description}</Text>

              <View style={styles.conceptRow}>
                {v.keyConcepts.map((c, idx) => (
                  <View key={idx} style={styles.conceptPill}>
                    <Text style={styles.conceptPillText}>• {c}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardArrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
  cardDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
  },
  conceptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  conceptPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conceptPillText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
});
