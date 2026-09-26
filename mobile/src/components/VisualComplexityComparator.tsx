import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface ComplexityClass {
  notation: string;
  name: string;
  description: string;
  calcSteps: (n: number) => number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Horrible';
  color: string;
}

const COMPLEXITY_CLASSES: ComplexityClass[] = [
  {
    notation: 'O(1)',
    name: 'Constant Time',
    description: 'Direct memory index, hash map lookup.',
    calcSteps: () => 1,
    rating: 'Excellent',
    color: '#10b981',
  },
  {
    notation: 'O(log n)',
    name: 'Logarithmic Time',
    description: 'Halving search space (Binary Search).',
    calcSteps: (n) => Math.ceil(Math.log2(n)),
    rating: 'Excellent',
    color: '#34d399',
  },
  {
    notation: 'O(n)',
    name: 'Linear Time',
    description: 'Single iteration through all elements.',
    calcSteps: (n) => n,
    rating: 'Good',
    color: '#38bdf8',
  },
  {
    notation: 'O(n log n)',
    name: 'Linearithmic Time',
    description: 'Optimal comparison sorting (Merge/Quick).',
    calcSteps: (n) => Math.round(n * Math.log2(n)),
    rating: 'Fair',
    color: '#fbbf24',
  },
  {
    notation: 'O(n²)',
    name: 'Quadratic Time',
    description: 'Nested loops, pairwise element comparisons.',
    calcSteps: (n) => n * n,
    rating: 'Poor',
    color: '#f97316',
  },
  {
    notation: 'O(2ⁿ)',
    name: 'Exponential Time',
    description: 'Recursive branching (Subsets, naive recursion).',
    calcSteps: (n) => (n <= 30 ? Math.pow(2, n) : Number.POSITIVE_INFINITY),
    rating: 'Horrible',
    color: '#ef4444',
  },
];

const N_PRESETS = [10, 50, 100, 500, 1000, 5000, 10000];

export function VisualComplexityComparator() {
  const [n, setN] = useState<number>(100);

  // Format big numbers cleanly
  const formatOps = (ops: number): string => {
    if (!Number.isFinite(ops)) return '∞ (Explosive)';
    if (ops >= 1e12) return `${(ops / 1e12).toFixed(1)}T`;
    if (ops >= 1e9) return `${(ops / 1e9).toFixed(1)}B`;
    if (ops >= 1e6) return `${(ops / 1e6).toFixed(1)}M`;
    if (ops >= 1e3) return `${(ops / 1e3).toFixed(1)}k`;
    return ops.toLocaleString();
  };

  // Estimate execution time at 1 GHz CPU (10^9 ops/sec)
  const formatTime = (ops: number): string => {
    if (!Number.isFinite(ops)) return '> Age of Universe';
    const seconds = ops / 1e9;
    if (seconds < 1e-6) return '< 1 µs';
    if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(0)} µs`;
    if (seconds < 1) return `${(seconds * 1000).toFixed(1)} ms`;
    if (seconds < 60) return `${seconds.toFixed(2)} sec`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
    return `${(seconds / 86400).toFixed(0)} days`;
  };

  // Max reference operations for visual bar scale (capped at O(n^2))
  const maxRefOps = n * n;

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>Big-O Growth Rate Simulator</Text>
        <Text style={styles.subtitle}>
          Select input size N to observe operational scaling and execution time
        </Text>
      </View>

      {/* N Preset Selector */}
      <View style={styles.nSelectorRow}>
        <Text style={styles.nSelectorLabel}>Input Size (N):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nScroll}>
          {N_PRESETS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.nPill, n === val && styles.nPillActive]}
              onPress={() => setN(val)}
            >
              <Text style={[styles.nPillText, n === val && styles.nPillTextActive]}>
                N = {val >= 1000 ? `${val / 1000}k` : val}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Complexity Cards */}
      <View style={styles.classList}>
        {COMPLEXITY_CLASSES.map((cls) => {
          const ops = cls.calcSteps(n);
          const time = formatTime(ops);
          const opsStr = formatOps(ops);

          // Relative bar width percentage
          let barPercent = 5;
          if (Number.isFinite(ops) && maxRefOps > 0) {
            barPercent = Math.min(100, Math.max(4, Math.round((ops / maxRefOps) * 100)));
          } else if (!Number.isFinite(ops)) {
            barPercent = 100;
          }

          return (
            <View key={cls.notation} style={styles.classCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.notationRow}>
                  <Text style={[styles.notationText, { color: cls.color }]}>
                    {cls.notation}
                  </Text>
                  <Text style={styles.nameText}>{cls.name}</Text>
                </View>

                <View
                  style={[
                    styles.ratingBadge,
                    { borderColor: cls.color, backgroundColor: `${cls.color}15` },
                  ]}
                >
                  <Text style={[styles.ratingText, { color: cls.color }]}>
                    {cls.rating}
                  </Text>
                </View>
              </View>

              <Text style={styles.descText}>{cls.description}</Text>

              {/* Visual Relative Scale Bar */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${barPercent}%`, backgroundColor: cls.color },
                  ]}
                />
              </View>

              {/* Numbers Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricLabel}>Operations:</Text>
                  <Text style={styles.metricVal}>{opsStr}</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricLabel}>Est. CPU Time (1GHz):</Text>
                  <Text style={[styles.metricVal, { color: cls.color }]}>
                    {time}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Socratic Insight Callout */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>💡 Socratic Algorithmic Rule of Thumb:</Text>
        <Text style={styles.insightText}>
          • For technical interviews: If $N \le 10^5$, optimal solutions must be{' '}
          <Text style={{ color: '#38bdf8', fontWeight: '700' }}>O(n)</Text> or{' '}
          <Text style={{ color: '#fbbf24', fontWeight: '700' }}>O(n log n)</Text>.
          {'\n'}• An <Text style={{ color: '#f97316', fontWeight: '700' }}>O(n²)</Text> algorithm on $N = 10^5$ takes $10^{10}$ operations (10 seconds, causing Time Limit Exceeded / TLE)!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  nSelectorRow: {
    marginBottom: 16,
    backgroundColor: '#090d16',
    padding: 10,
    borderRadius: 12,
  },
  nSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  nScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  nPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  nPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  nPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  nPillTextActive: {
    color: '#ffffff',
  },
  classList: {
    gap: 10,
    marginBottom: 14,
  },
  classCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notationText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  nameText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
  },
  descText: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#090d16',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 6,
    marginTop: 2,
  },
  metricColumn: {
    gap: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'monospace',
  },
  insightCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#818cf8',
    gap: 4,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c7d2fe',
  },
  insightText: {
    fontSize: 11,
    color: '#e0e7ff',
    lineHeight: 18,
  },
});
