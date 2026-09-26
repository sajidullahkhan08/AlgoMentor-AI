import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export type DPProblemType = 'grid_paths' | 'knapsack';

interface DPStep {
  step: number;
  row: number;
  col: number;
  value: number;
  formula: string;
  explanation: string;
  depRowsCols: Array<[number, number]>;
}

export function VisualDPMatrix() {
  const [problemType, setProblemType] = useState<DPProblemType>('grid_paths');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<DPStep[]>([]);
  const [matrixState, setMatrixState] = useState<number[][]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Rows and Cols based on problem type
  const numRows = problemType === 'grid_paths' ? 3 : 4; // 3 rows for grid, 4 items (0..3) for knapsack
  const numCols = problemType === 'grid_paths' ? 4 : 6; // 4 cols for grid, 6 weights (0..5) for knapsack

  useEffect(() => {
    const computedSteps: DPStep[] = [];
    const rows = problemType === 'grid_paths' ? 3 : 4;
    const cols = problemType === 'grid_paths' ? 4 : 6;

    if (problemType === 'grid_paths') {
      // Grid Unique Paths: dp[i][j] = dp[i-1][j] + dp[i][j-1]
      const dp: number[][] = Array(rows)
        .fill(0)
        .map(() => Array(cols).fill(0));

      let stepCount = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 || c === 0) {
            dp[r][c] = 1;
            computedSteps.push({
              step: stepCount++,
              row: r,
              col: c,
              value: 1,
              formula: `dp[${r}][${c}] = 1 (Base Case)`,
              explanation: `Border cells have only 1 unique path: Moving strictly right along top row or strictly down along left column.`,
              depRowsCols: [],
            });
          } else {
            const fromTop = dp[r - 1][c];
            const fromLeft = dp[r][c - 1];
            dp[r][c] = fromTop + fromLeft;
            computedSteps.push({
              step: stepCount++,
              row: r,
              col: c,
              value: dp[r][c],
              formula: `dp[${r}][${c}] = dp[${r - 1}][${c}] (${fromTop}) + dp[${r}][${c - 1}] (${fromLeft}) = ${dp[r][c]}`,
              explanation: `Summing paths from top neighbor (${fromTop}) and left neighbor (${fromLeft}). Overlapping subproblems are reused in O(1) time!`,
              depRowsCols: [
                [r - 1, c],
                [r, c - 1],
              ],
            });
          }
        }
      }
    } else {
      // 0/1 Knapsack: Items = [(wt:1, val:6), (wt:2, val:10), (wt:3, val:12)]
      const weights = [1, 2, 3];
      const values = [6, 10, 12];
      const dp: number[][] = Array(4)
        .fill(0)
        .map(() => Array(6).fill(0));

      let stepCount = 1;
      for (let i = 0; i <= 3; i++) {
        for (let w = 0; w <= 5; w++) {
          if (i === 0 || w === 0) {
            dp[i][w] = 0;
            computedSteps.push({
              step: stepCount++,
              row: i,
              col: w,
              value: 0,
              formula: `dp[${i}][${w}] = 0 (Base Case)`,
              explanation: `0 items or 0 capacity yields 0 maximum value.`,
              depRowsCols: [],
            });
          } else {
            const itemWt = weights[i - 1];
            const itemVal = values[i - 1];
            const excludeVal = dp[i - 1][w];

            if (itemWt <= w) {
              const includeVal = itemVal + dp[i - 1][w - itemWt];
              dp[i][w] = Math.max(excludeVal, includeVal);
              computedSteps.push({
                step: stepCount++,
                row: i,
                col: w,
                value: dp[i][w],
                formula: `max(exclude: ${excludeVal}, include: ${itemVal} + dp[${i - 1}][${w - itemWt}]) = ${dp[i][w]}`,
                explanation: `Item ${i} (wt:${itemWt}, val:${itemVal}) fits in capacity ${w}. Choosing max of excluding item (${excludeVal}) vs including it (${includeVal}).`,
                depRowsCols: [
                  [i - 1, w],
                  [i - 1, w - itemWt],
                ],
              });
            } else {
              dp[i][w] = excludeVal;
              computedSteps.push({
                step: stepCount++,
                row: i,
                col: w,
                value: dp[i][w],
                formula: `dp[${i}][${w}] = dp[${i - 1}][${w}] (${excludeVal})`,
                explanation: `Item ${i} weight (${itemWt}) exceeds capacity ${w}. Must exclude item.`,
                depRowsCols: [[i - 1, w]],
              });
            }
          }
        }
      }
    }

    setSteps(computedSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [problemType]);

  // Construct current display matrix up to current step
  useEffect(() => {
    const rows = problemType === 'grid_paths' ? 3 : 4;
    const cols = problemType === 'grid_paths' ? 4 : 6;
    const currentMat: number[][] = Array(rows)
      .fill(-1)
      .map(() => Array(cols).fill(-1));

    for (let i = 0; i <= currentStepIndex && i < steps.length; i++) {
      const s = steps[i];
      currentMat[s.row][s.col] = s.value;
    }
    setMatrixState(currentMat);
  }, [currentStepIndex, steps, problemType]);

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 900);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const currentStep = steps[currentStepIndex] || {
    step: 1,
    row: 0,
    col: 0,
    value: 0,
    formula: 'Initializing DP Table',
    explanation: 'Step through to watch bottom-up subproblem solving.',
    depRowsCols: [],
  };

  const isDependency = (r: number, c: number) => {
    return currentStep.depRowsCols.some(([dr, dc]) => dr === r && dc === c);
  };

  return (
    <View style={styles.container}>
      {/* Problem Mode Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, problemType === 'grid_paths' && styles.tabButtonActive]}
          onPress={() => setProblemType('grid_paths')}
        >
          <Text
            style={[
              styles.tabButtonText,
              problemType === 'grid_paths' && styles.tabButtonTextActive,
            ]}
          >
            Grid Unique Paths (3 × 4)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, problemType === 'knapsack' && styles.tabButtonActive]}
          onPress={() => setProblemType('knapsack')}
        >
          <Text
            style={[
              styles.tabButtonText,
              problemType === 'knapsack' && styles.tabButtonTextActive,
            ]}
          >
            0/1 Knapsack (Cap = 5)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recurrence Formula Bar */}
      <View style={styles.formulaBar}>
        <Text style={styles.formulaLabel}>Recurrence Relation:</Text>
        <Text style={styles.formulaCode}>
          {problemType === 'grid_paths'
            ? 'dp[r][c] = dp[r-1][c] + dp[r][c-1]'
            : 'dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w-wt[i]])'}
        </Text>
      </View>

      {/* Dynamic 2D Matrix Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matrixContainer}>
        <View>
          {/* Column Index Headers */}
          <View style={styles.matrixRow}>
            <View style={styles.indexHeaderCell}>
              <Text style={styles.indexHeaderText}>r\c</Text>
            </View>
            {Array.from({ length: numCols }).map((_, c) => (
              <View key={c} style={styles.indexHeaderCell}>
                <Text style={styles.indexHeaderText}>
                  {problemType === 'grid_paths' ? `c${c}` : `w${c}`}
                </Text>
              </View>
            ))}
          </View>

          {/* Matrix Body */}
          {Array.from({ length: numRows }).map((_, r) => (
            <View key={r} style={styles.matrixRow}>
              {/* Row Header */}
              <View style={styles.indexHeaderCell}>
                <Text style={styles.indexHeaderText}>
                  {problemType === 'grid_paths' ? `r${r}` : `i${r}`}
                </Text>
              </View>

              {/* Data Cells */}
              {Array.from({ length: numCols }).map((_, c) => {
                const val = matrixState[r]?.[c];
                const isCurrent = currentStep.row === r && currentStep.col === c;
                const isDep = isDependency(r, c);
                const hasComputed = val !== undefined && val !== -1;

                return (
                  <View
                    key={c}
                    style={[
                      styles.cell,
                      hasComputed && styles.cellComputed,
                      isDep && styles.cellDependency,
                      isCurrent && styles.cellCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellValue,
                        hasComputed && styles.cellValueComputed,
                        isDep && styles.cellValueDep,
                        isCurrent && styles.cellValueCurrent,
                      ]}
                    >
                      {hasComputed ? val : '·'}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Step Formula & Explanation Card */}
      <View style={styles.explanationCard}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Step {currentStepIndex + 1} of {steps.length}: {currentStep.formula}
          </Text>
        </View>
        <Text style={styles.explanationText}>{currentStep.explanation}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.btnSecondary, currentStepIndex === 0 && styles.btnDisabled]}
          onPress={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentStepIndex === 0}
        >
          <Text style={styles.btnSecondaryText}>◀ Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Text style={styles.btnSecondaryText}>
            {isPlaying ? '⏸ Pause' : '▶ Auto-Play'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => {
            setIsPlaying(false);
            setCurrentStepIndex(0);
          }}
        >
          <Text style={styles.btnSecondaryText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnPrimary,
            currentStepIndex === steps.length - 1 && styles.btnDisabled,
          ]}
          onPress={() =>
            setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))
          }
          disabled={currentStepIndex === steps.length - 1}
        >
          <Text style={styles.btnPrimaryText}>Next ▶</Text>
        </TouchableOpacity>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabButtonActive: {
    backgroundColor: '#1e293b',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#38bdf8',
  },
  formulaBar: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 2,
  },
  formulaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  formulaCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  matrixContainer: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  matrixRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  indexHeaderCell: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellComputed: {
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  cellDependency: {
    borderColor: '#ec4899',
    backgroundColor: '#500724',
    borderWidth: 2,
  },
  cellCurrent: {
    borderColor: '#38bdf8',
    backgroundColor: '#0284c7',
    borderWidth: 2.5,
    transform: [{ scale: 1.08 }],
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'monospace',
  },
  cellValueComputed: {
    color: '#e2e8f0',
  },
  cellValueDep: {
    color: '#fbcfe8',
    fontWeight: '800',
  },
  cellValueCurrent: {
    color: '#ffffff',
    fontWeight: '900',
  },
  explanationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    marginBottom: 12,
  },
  stepBadge: {
    marginBottom: 4,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  explanationText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  btnSecondary: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  btnPrimary: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.35,
  },
});
