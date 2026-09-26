import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export type TwoPointerMode = 'collision' | 'sliding_window';

interface PointerStep {
  step: number;
  left: number;
  right: number;
  currentSum: number;
  target?: number;
  action: string;
  explanation: string;
  isMatch?: boolean;
}

const COLLISION_ARRAY = [2, 3, 5, 8, 11, 14, 18];
const TARGET_SUM = 19; // 5 + 14 = 19

const WINDOW_ARRAY = [2, 1, 5, 1, 3, 2];
const WINDOW_SIZE_K = 3;

export function VisualTwoPointerSlidingWindow() {
  const [mode, setMode] = useState<TwoPointerMode>('collision');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<PointerStep[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const computedSteps: PointerStep[] = [];

    if (mode === 'collision') {
      // Two-pointer collision on sorted array
      let l = 0;
      let r = COLLISION_ARRAY.length - 1;
      let stepNum = 1;

      while (l < r) {
        const sum = COLLISION_ARRAY[l] + COLLISION_ARRAY[r];
        if (sum === TARGET_SUM) {
          computedSteps.push({
            step: stepNum,
            left: l,
            right: r,
            currentSum: sum,
            target: TARGET_SUM,
            action: `Target Matched! nums[${l}] (${COLLISION_ARRAY[l]}) + nums[${r}] (${COLLISION_ARRAY[r]}) = ${sum}`,
            explanation: `Found target pair! Indices [${l}, ${r}] satisfy the target sum of ${TARGET_SUM}. Algorithmic invariant holds true in O(n) time!`,
            isMatch: true,
          });
          break;
        } else if (sum < TARGET_SUM) {
          computedSteps.push({
            step: stepNum,
            left: l,
            right: r,
            currentSum: sum,
            target: TARGET_SUM,
            action: `Sum (${sum}) < Target (${TARGET_SUM}) ➔ Increment Left Pointer`,
            explanation: `Because array is sorted, any element paired with nums[${l}] (${COLLISION_ARRAY[l]}) will yield < target. Advance L = ${l + 1}.`,
            isMatch: false,
          });
          l++;
        } else {
          computedSteps.push({
            step: stepNum,
            left: l,
            right: r,
            currentSum: sum,
            target: TARGET_SUM,
            action: `Sum (${sum}) > Target (${TARGET_SUM}) ➔ Decrement Right Pointer`,
            explanation: `Because array is sorted, any element paired with nums[${r}] (${COLLISION_ARRAY[r]}) will yield > target. Decrement R = ${r - 1}.`,
            isMatch: false,
          });
          r--;
        }
        stepNum++;
      }
    } else {
      // Sliding Window of size K = 3
      let windowSum = 0;
      for (let i = 0; i < WINDOW_SIZE_K; i++) {
        windowSum += WINDOW_ARRAY[i];
      }

      computedSteps.push({
        step: 1,
        left: 0,
        right: WINDOW_SIZE_K - 1,
        currentSum: windowSum,
        action: `Initial Window [0..${WINDOW_SIZE_K - 1}]: Sum = ${windowSum}`,
        explanation: `Summing first ${WINDOW_SIZE_K} elements (2 + 1 + 5 = 8). Max sum initialized to ${windowSum}.`,
        isMatch: false,
      });

      let stepNum = 2;
      let maxSum = windowSum;

      for (let r = WINDOW_SIZE_K; r < WINDOW_ARRAY.length; r++) {
        const l = r - WINDOW_SIZE_K + 1;
        const prevL = l - 1;
        const exiting = WINDOW_ARRAY[prevL];
        const entering = WINDOW_ARRAY[r];
        windowSum = windowSum - exiting + entering;
        if (windowSum > maxSum) maxSum = windowSum;

        computedSteps.push({
          step: stepNum++,
          left: l,
          right: r,
          currentSum: windowSum,
          action: `Slide Window to [${l}..${r}]: Subtracted ${exiting}, Added ${entering}`,
          explanation: `Sliding Window maintains O(1) state transition by dropping left element nums[${prevL}] (${exiting}) and adding new right element nums[${r}] (${entering}). Current Window Sum: ${windowSum}.`,
          isMatch: windowSum === maxSum,
        });
      }
    }

    setSteps(computedSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [mode]);

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
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const currentStep = steps[currentStepIndex] || {
    step: 1,
    left: 0,
    right: 0,
    currentSum: 0,
    action: 'Initializing',
    explanation: 'Select pattern mode and step forward.',
    isMatch: false,
  };

  const currentArray = mode === 'collision' ? COLLISION_ARRAY : WINDOW_ARRAY;

  return (
    <View style={styles.container}>
      {/* Pattern Selector Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'collision' && styles.tabButtonActive]}
          onPress={() => setMode('collision')}
        >
          <Text
            style={[
              styles.tabButtonText,
              mode === 'collision' && styles.tabButtonTextActive,
            ]}
          >
            Two-Pointer Collision (Two Sum II)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'sliding_window' && styles.tabButtonActive]}
          onPress={() => setMode('sliding_window')}
        >
          <Text
            style={[
              styles.tabButtonText,
              mode === 'sliding_window' && styles.tabButtonTextActive,
            ]}
          >
            Sliding Window (Size K = 3)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Target & Metric Info Bar */}
      <View style={styles.metricBar}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>
            {mode === 'collision' ? 'Target Sum:' : 'Window Size K:'}
          </Text>
          <Text style={styles.metricValue}>
            {mode === 'collision' ? TARGET_SUM : WINDOW_SIZE_K}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Current Sum:</Text>
          <Text
            style={[
              styles.metricValue,
              currentStep.isMatch && styles.metricValueMatch,
            ]}
          >
            {currentStep.currentSum}
          </Text>
        </View>
      </View>

      {/* Array Elements Visualization */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.arrayScroll}>
        {currentArray.map((val, idx) => {
          const isL = idx === currentStep.left;
          const isR = idx === currentStep.right;
          const inWindow =
            mode === 'sliding_window' &&
            idx >= currentStep.left &&
            idx <= currentStep.right;

          return (
            <View key={idx} style={styles.elementColumn}>
              {/* Pointer Markers Row */}
              <View style={styles.pointerHeader}>
                {isL && (
                  <View style={[styles.pointerPill, { backgroundColor: '#38bdf8' }]}>
                    <Text style={styles.pointerPillText}>L</Text>
                  </View>
                )}
                {isR && (
                  <View style={[styles.pointerPill, { backgroundColor: '#ec4899' }]}>
                    <Text style={styles.pointerPillText}>R</Text>
                  </View>
                )}
              </View>

              {/* Number Box */}
              <View
                style={[
                  styles.arrayBox,
                  (isL || isR) && styles.arrayBoxActive,
                  inWindow && styles.arrayBoxWindow,
                  currentStep.isMatch && (isL || isR) && styles.arrayBoxMatch,
                ]}
              >
                <Text
                  style={[
                    styles.arrayValue,
                    (isL || isR) && styles.arrayValueActive,
                    currentStep.isMatch && (isL || isR) && styles.arrayValueMatch,
                  ]}
                >
                  {val}
                </Text>
              </View>

              <Text style={styles.indexLabel}>[{idx}]</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Step Explanation Card */}
      <View style={styles.explanationCard}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Step {currentStepIndex + 1} of {steps.length}: {currentStep.action}
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
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#38bdf8',
  },
  metricBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'monospace',
  },
  metricValueMatch: {
    color: '#34d399',
  },
  arrayScroll: {
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  elementColumn: {
    alignItems: 'center',
    width: 48,
  },
  pointerHeader: {
    flexDirection: 'row',
    height: 20,
    gap: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointerPill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  arrayBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrayBoxActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c4a6e',
    borderWidth: 2,
  },
  arrayBoxWindow: {
    borderColor: '#a855f7',
    backgroundColor: '#3b0764',
    borderWidth: 2,
  },
  arrayBoxMatch: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
    borderWidth: 2.5,
  },
  arrayValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  arrayValueActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  arrayValueMatch: {
    color: '#6ee7b7',
    fontWeight: '900',
  },
  indexLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'monospace',
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
