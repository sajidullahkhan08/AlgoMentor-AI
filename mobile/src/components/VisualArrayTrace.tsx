import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface TraceStep {
  step: number;
  left: number;
  right: number;
  mid: number;
  condition: string;
  action: string;
  found: boolean;
}

interface VisualArrayTraceProps {
  initialArray?: number[];
  initialTarget?: number;
  title?: string;
}

export function VisualArrayTrace({
  initialArray = [-1, 0, 3, 5, 9, 12],
  initialTarget = 9,
  title = 'Binary Search Invariant Visualizer',
}: VisualArrayTraceProps) {
  const [array] = useState<number[]>(initialArray);
  const [target] = useState<number>(initialTarget);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [steps, setSteps] = useState<TraceStep[]>([]);

  // Precompute Binary Search steps
  useEffect(() => {
    const computedSteps: TraceStep[] = [];
    let l = 0;
    let r = array.length - 1;
    let stepCount = 1;

    while (l <= r) {
      const m = Math.floor((l + r) / 2);
      const val = array[m];

      if (val === target) {
        computedSteps.push({
          step: stepCount,
          left: l,
          right: r,
          mid: m,
          condition: `nums[${m}] = ${val} == target (${target})`,
          action: `Target discovered at index ${m}! Invariant satisfied.`,
          found: true,
        });
        break;
      } else if (val < target) {
        computedSteps.push({
          step: stepCount,
          left: l,
          right: r,
          mid: m,
          condition: `nums[${m}] = ${val} < target (${target})`,
          action: `Target must be in right half. Eliminate [${l}..${m}]. Set left = mid + 1 (${m + 1}).`,
          found: false,
        });
        l = m + 1;
      } else {
        computedSteps.push({
          step: stepCount,
          left: l,
          right: r,
          mid: m,
          condition: `nums[${m}] = ${val} > target (${target})`,
          action: `Target must be in left half. Eliminate [${m}..${r}]. Set right = mid - 1 (${m - 1}).`,
          found: false,
        });
        r = m - 1;
      }
      stepCount++;
    }

    if (computedSteps.length === 0 || !computedSteps[computedSteps.length - 1].found) {
      computedSteps.push({
        step: stepCount,
        left: l,
        right: r,
        mid: -1,
        condition: `left (${l}) > right (${r})`,
        action: `Search space exhausted. Target ${target} does not exist in array. Return -1.`,
        found: false,
      });
    }

    setSteps(computedSteps);
    setCurrentStepIndex(0);
  }, [array, target]);

  const currentStep = steps[currentStepIndex] || {
    step: 1,
    left: 0,
    right: array.length - 1,
    mid: Math.floor((array.length - 1) / 2),
    condition: 'Initializing pointers',
    action: 'Ready to trace search space halving.',
    found: false,
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Target = <Text style={styles.highlightText}>{target}</Text> | Step{' '}
            {currentStepIndex + 1} of {steps.length}
          </Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendBadge, { backgroundColor: '#38bdf8' }]}>
            <Text style={styles.legendText}>L</Text>
          </View>
          <View style={[styles.legendBadge, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.legendText}>M</Text>
          </View>
          <View style={[styles.legendBadge, { backgroundColor: '#ec4899' }]}>
            <Text style={styles.legendText}>R</Text>
          </View>
        </View>
      </View>

      {/* Array Elements Visualization */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.arrayScroll}>
        {array.map((val, idx) => {
          const isLeft = idx === currentStep.left;
          const isRight = idx === currentStep.right;
          const isMid = idx === currentStep.mid;
          const isInSearchSpace =
            idx >= currentStep.left && idx <= currentStep.right;
          const isTargetMatch = currentStep.found && isMid;

          return (
            <View key={idx} style={styles.elementColumn}>
              {/* Pointer tags row */}
              <View style={styles.pointerRow}>
                {isLeft && (
                  <View style={[styles.pointerPill, { backgroundColor: '#38bdf8' }]}>
                    <Text style={styles.pointerPillText}>L</Text>
                  </View>
                )}
                {isMid && (
                  <View style={[styles.pointerPill, { backgroundColor: '#f59e0b' }]}>
                    <Text style={styles.pointerPillText}>M</Text>
                  </View>
                )}
                {isRight && (
                  <View style={[styles.pointerPill, { backgroundColor: '#ec4899' }]}>
                    <Text style={styles.pointerPillText}>R</Text>
                  </View>
                )}
              </View>

              {/* Number box */}
              <View
                style={[
                  styles.arrayBox,
                  isInSearchSpace ? styles.arrayBoxActive : styles.arrayBoxDimmed,
                  isMid ? styles.arrayBoxMid : null,
                  isTargetMatch ? styles.arrayBoxFound : null,
                ]}
              >
                <Text
                  style={[
                    styles.arrayValue,
                    !isInSearchSpace && styles.arrayValueDimmed,
                    isTargetMatch && styles.arrayValueFound,
                  ]}
                >
                  {val}
                </Text>
              </View>

              {/* Index label */}
              <Text style={styles.indexLabel}>[{idx}]</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Step Explanation Card */}
      <View style={styles.explanationCard}>
        <View style={styles.explanationBadge}>
          <Text style={styles.explanationBadgeText}>
            {currentStep.found
              ? '🎯 Target Reached'
              : currentStep.mid === -1
              ? '❌ Invariant Broken'
              : '🔍 Invariant Check'}
          </Text>
        </View>
        <Text style={styles.conditionText}>{currentStep.condition}</Text>
        <Text style={styles.actionText}>{currentStep.action}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.btnSecondary, currentStepIndex === 0 && styles.btnDisabled]}
          onPress={handlePrev}
          disabled={currentStepIndex === 0}
        >
          <Text style={styles.btnSecondaryText}>◀ Prev Step</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={handleReset}>
          <Text style={styles.btnOutlineText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnPrimary,
            currentStepIndex === steps.length - 1 && styles.btnDisabled,
          ]}
          onPress={handleNext}
          disabled={currentStepIndex === steps.length - 1}
        >
          <Text style={styles.btnPrimaryText}>Next Step ▶</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  highlightText: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 6,
  },
  legendBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  arrayScroll: {
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  elementColumn: {
    alignItems: 'center',
    width: 52,
  },
  pointerRow: {
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
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrayBoxActive: {
    borderColor: '#60a5fa',
    backgroundColor: '#1e293b',
  },
  arrayBoxDimmed: {
    opacity: 0.35,
    borderColor: '#1e293b',
    backgroundColor: '#090d16',
  },
  arrayBoxMid: {
    borderColor: '#f59e0b',
    backgroundColor: '#272215',
    borderWidth: 2,
  },
  arrayBoxFound: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
    borderWidth: 2.5,
  },
  arrayValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  arrayValueDimmed: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  arrayValueFound: {
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
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  explanationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  explanationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  btnSecondary: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnSecondaryText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  btnOutline: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnOutlineText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
