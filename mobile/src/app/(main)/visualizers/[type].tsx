import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { VisualTreeTraversal } from '../../../components/VisualTreeTraversal';
import { VisualGraphTraversal } from '../../../components/VisualGraphTraversal';
import { VisualTwoPointerSlidingWindow } from '../../../components/VisualTwoPointerSlidingWindow';
import { VisualDPMatrix } from '../../../components/VisualDPMatrix';
import { VisualComplexityComparator } from '../../../components/VisualComplexityComparator';
import { VisualArrayTrace } from '../../../components/VisualArrayTrace';

export default function VisualizerPlaygroundScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();

  const getVisualizerMeta = () => {
    switch (type) {
      case 'tree':
        return {
          title: 'Binary Tree Traversals',
          badge: 'Trees & Recursion',
          color: '#10b981',
          component: <VisualTreeTraversal />,
          invariant:
            'In-Order traversal on a Binary Search Tree (BST) always visits nodes in monotonically non-decreasing sorted order (Left -> Root -> Right).',
          interviewTip:
            'Use Pre-Order to clone/serialize trees. Use Post-Order for bottom-up property aggregation (like finding tree height or diameter).',
        };
      case 'graph':
        return {
          title: 'Graph BFS & DFS',
          badge: 'Graph Algorithms',
          color: '#f59e0b',
          component: <VisualGraphTraversal />,
          invariant:
            'In unweighted graphs, Breadth-First Search (BFS) is guaranteed to find the shortest path from source to target because it expands by unit radius.',
          interviewTip:
            'Always mark nodes as visited immediately upon enqueuing in BFS to prevent exponential duplicate pushes and infinite loops in cyclic graphs.',
        };
      case 'two_pointers':
        return {
          title: 'Two-Pointers & Sliding Window',
          badge: 'Array Patterns',
          color: '#38bdf8',
          component: <VisualTwoPointerSlidingWindow />,
          invariant:
            'On sorted arrays, adjusting left or right pointers eliminates an entire row/column of candidates in O(1) time without evaluating them.',
          interviewTip:
            'Use two pointers when dealing with sorted arrays, palindromes, or pair targets. Use sliding windows when finding contiguous subarrays meeting constraints.',
        };
      case 'array_search':
        return {
          title: 'Binary Search Invariant',
          badge: 'Searching',
          color: '#6366f1',
          component: (
            <VisualArrayTrace
              initialArray={[-1, 0, 3, 5, 9, 12]}
              initialTarget={9}
              title="Binary Search Search Space Halving"
            />
          ),
          invariant:
            'Search space [L..R] maintains the property that target must lie within the range if it exists in the array.',
          interviewTip:
            'Beware of mid overflow in languages like C++/Java: prefer mid = left + Math.floor((right - left) / 2).',
        };
      case 'dp_matrix':
        return {
          title: 'Dynamic Programming Matrix',
          badge: 'Dynamic Programming',
          color: '#ec4899',
          component: <VisualDPMatrix />,
          invariant:
            'Optimal substructure: The optimal solution to the overall problem incorporates optimal solutions to its smaller subproblems.',
          interviewTip:
            'Identify state dimensions first (e.g. dp[i][w] = max value for prefix items i with remaining capacity w), then determine base cases and topological evaluation order.',
        };
      case 'complexity':
      default:
        return {
          title: 'Big-O Growth Comparator',
          badge: 'Complexity Analysis',
          color: '#a855f7',
          component: <VisualComplexityComparator />,
          invariant:
            'Asymptotic upper bounds measure how computation time scales relative to input size N, ignoring constant hardware coefficients.',
          interviewTip:
            'If N <= 10^5, aim for O(n) or O(n log n). If N <= 20, exponential O(2^n) backtracking is acceptable.',
        };
    }
  };

  const meta = getVisualizerMeta();

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Mental Models</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.screenTitle}>{meta.title}</Text>
          <View
            style={[
              styles.badge,
              { borderColor: meta.color, backgroundColor: `${meta.color}15` },
            ]}
          >
            <Text style={[styles.badgeText, { color: meta.color }]}>
              {meta.badge}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Render the interactive visualizer component */}
        {meta.component}

        {/* Algorithmic Invariant Callout */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>🛡️ Core Algorithmic Invariant:</Text>
          <Text style={styles.cardBody}>{meta.invariant}</Text>
        </View>

        {/* Interview Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipHeading}>🎯 Technical Interview Takeaway:</Text>
          <Text style={styles.tipBody}>{meta.interviewTip}</Text>
        </View>

        {/* Practice Related Problems CTA */}
        <TouchableOpacity
          style={styles.practiceBtn}
          onPress={() => router.push('/(main)/problems/index' as any)}
        >
          <Text style={styles.practiceBtnText}>
            Practice LeetCode Problems With This Pattern ➔
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  backButton: {
    paddingBottom: 6,
  },
  backButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 14,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  cardBody: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4338ca',
    gap: 6,
  },
  tipHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c7d2fe',
  },
  tipBody: {
    fontSize: 13,
    color: '#e0e7ff',
    lineHeight: 20,
  },
  practiceBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginTop: 4,
  },
  practiceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
});
