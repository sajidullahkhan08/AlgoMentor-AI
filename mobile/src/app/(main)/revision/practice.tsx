/**
 * Active Retrieval Practice Session Screen (Phase 8).
 *
 * Implements:
 * - Active recall flashcard mechanism (question -> reveal invariant -> self-rate)
 * - SM-2 confidence rating (0: Blackout, 2: Hard, 3: Good, 5: Perfect)
 * - Real-time Leitner box advancement feedback
 * - Scratchpad for formulating reasoning before reveal
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchRevisionQueue,
  submitRevisionReview,
  RevisionItem,
  RevisionReviewResult,
} from '../../../lib/api';

export default function RevisionPracticeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<RevisionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchpadText, setScratchpadText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [lastResult, setLastResult] = useState<RevisionReviewResult | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedHistory, setReviewedHistory] = useState<RevisionReviewResult[]>([]);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRevisionQueue();
      // Prioritize due items; if none due, allow practice on upcoming items
      const combined = [...(data.dueItems || []), ...(data.upcomingItems || [])];
      setQueue(combined);
    } catch (err: any) {
      console.error('[RevisionPractice] Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const currentItem = queue[currentIndex];

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleRate = async (rating: number) => {
    if (!currentItem || submittingRating) return;

    try {
      setSubmittingRating(true);
      const result = await submitRevisionReview(currentItem.id, rating);
      setLastResult(result);
      setReviewedHistory((prev) => [...prev, result]);

      // Delay slightly for user to see the transition before advancing
      setTimeout(() => {
        setLastResult(null);
        setIsRevealed(false);
        setScratchpadText('');

        if (currentIndex + 1 < queue.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setSessionCompleted(true);
        }
        setSubmittingRating(false);
      }, 900);
    } catch (err: any) {
      console.error('[RevisionPractice] Rating failed:', err);
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading retrieval cards...</Text>
      </View>
    );
  }

  if (sessionCompleted || queue.length === 0) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedCard}>
          <Text style={styles.completedIcon}>🎉</Text>
          <Text style={styles.completedTitle}>Retrieval Session Complete!</Text>
          <Text style={styles.completedDesc}>
            You practiced {reviewedHistory.length} algorithmic invariants. Spaced repetition keeps
            these concepts sharp in long-term memory.
          </Text>

          {reviewedHistory.length > 0 && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Session Breakdown:</Text>
              {reviewedHistory.map((res, idx) => (
                <View key={idx} style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemTitle} numberOfLines={1}>
                    • {res.item.title}
                  </Text>
                  <Text
                    style={[
                      styles.summaryItemBox,
                      { color: res.newBox >= res.previousBox ? '#10b981' : '#f43f5e' },
                    ]}
                  >
                    Box {res.previousBox} ➔ Box {res.newBox}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => router.replace('/(main)/revision' as any)}
          >
            <Text style={styles.returnBtnText}>Back to Revision Overview</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Progress Bar */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressInfoRow}>
            <Text style={styles.progressText}>
              Card {currentIndex + 1} of {queue.length}
            </Text>
            <Text style={styles.boxIndicator}>
              Current: Box {currentItem.leitner_box} ({currentItem.interval_days}d interval)
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${((currentIndex + 1) / queue.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Card Component */}
        <View style={styles.cardContainer}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{currentItem.item_type.toUpperCase()}</Text>
            </View>
            <Text style={styles.cardCadenceText}>
              Reps: {currentItem.repetition_count} • EF: {currentItem.easiness_factor.toFixed(2)}
            </Text>
          </View>

          {/* Title & Retrieval Prompt */}
          <Text style={styles.cardTitle}>{currentItem.title}</Text>
          <Text style={styles.cardPrompt}>{currentItem.prompt_question}</Text>

          {/* Front of Card: Mental Scratchpad */}
          {!isRevealed && (
            <View style={styles.scratchpadSection}>
              <Text style={styles.scratchpadLabel}>Formulate Your Invariant (Optional):</Text>
              <TextInput
                style={styles.scratchpadInput}
                placeholder="State the invariant or why this property holds before revealing..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                value={scratchpadText}
                onChangeText={setScratchpadText}
              />
              <TouchableOpacity
                style={styles.revealBtn}
                onPress={handleReveal}
                activeOpacity={0.8}
              >
                <Text style={styles.revealBtnText}>Reveal Invariant & Solution 👁️</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back of Card: Solution, Invariant & Rating */}
          {isRevealed && (
            <View style={styles.revealedSection}>
              {/* Highlighted Invariant Box */}
              <View style={styles.invariantBox}>
                <View style={styles.invariantHeader}>
                  <Text style={styles.invariantIcon}>🔑</Text>
                  <Text style={styles.invariantLabel}>Key Algorithmic Invariant</Text>
                </View>
                <Text style={styles.invariantText}>{currentItem.key_invariant}</Text>
              </View>

              {/* Full Solution Explanation */}
              <Text style={styles.solutionHeading}>Explanation & Rigorous Proof:</Text>
              <Text style={styles.solutionText}>{currentItem.solution_explanation}</Text>

              {/* Transition Banner if Just Rated */}
              {lastResult && (
                <View style={styles.resultToast}>
                  <Text style={styles.resultToastText}>{lastResult.message}</Text>
                </View>
              )}

              {/* Rating Section */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingPrompt}>How accurately did you recall this invariant?</Text>
                <View style={styles.ratingButtonsRow}>
                  <TouchableOpacity
                    style={[styles.rateBtn, { backgroundColor: '#f43f5e' }]}
                    onPress={() => handleRate(0)}
                    disabled={submittingRating}
                  >
                    <Text style={styles.rateEmoji}>🔴</Text>
                    <Text style={styles.rateBtnLabel}>Blanked</Text>
                    <Text style={styles.rateBtnSub}>Reset Box 1</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rateBtn, { backgroundColor: '#f97316' }]}
                    onPress={() => handleRate(2)}
                    disabled={submittingRating}
                  >
                    <Text style={styles.rateEmoji}>🟠</Text>
                    <Text style={styles.rateBtnLabel}>Strained</Text>
                    <Text style={styles.rateBtnSub}>Hard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rateBtn, { backgroundColor: '#eab308' }]}
                    onPress={() => handleRate(3)}
                    disabled={submittingRating}
                  >
                    <Text style={styles.rateEmoji}>🟡</Text>
                    <Text style={styles.rateBtnLabel}>Good</Text>
                    <Text style={styles.rateBtnSub}>Pass</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rateBtn, { backgroundColor: '#10b981' }]}
                    onPress={() => handleRate(5)}
                    disabled={submittingRating}
                  >
                    <Text style={styles.rateEmoji}>🟢</Text>
                    <Text style={styles.rateBtnLabel}>Instant</Text>
                    <Text style={styles.rateBtnSub}>Mastery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0f1d',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  progressBarWrapper: {
    marginBottom: 16,
    gap: 6,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  boxIndicator: {
    fontSize: 11,
    color: '#94a3b8',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  cardContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBadge: {
    backgroundColor: '#1e1b4b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  cardBadgeText: {
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '700',
  },
  cardCadenceText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    lineHeight: 24,
  },
  cardPrompt: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  scratchpadSection: {
    marginTop: 8,
    gap: 10,
  },
  scratchpadLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  scratchpadInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
  },
  revealBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  revealBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  revealedSection: {
    marginTop: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 12,
  },
  invariantBox: {
    backgroundColor: '#06281e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#10b981',
    gap: 6,
  },
  invariantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invariantIcon: {
    fontSize: 16,
  },
  invariantLabel: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  invariantText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  solutionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 4,
  },
  solutionText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 21,
  },
  resultToast: {
    backgroundColor: '#1e1b4b',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  resultToastText: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingSection: {
    marginTop: 8,
    gap: 10,
  },
  ratingPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  ratingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  rateBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  rateEmoji: {
    fontSize: 14,
  },
  rateBtnLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rateBtnSub: {
    color: '#ffffff',
    fontSize: 9,
    opacity: 0.85,
    fontWeight: '600',
  },
  completedContainer: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    padding: 20,
    justifyContent: 'center',
  },
  completedCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10b981',
    gap: 12,
  },
  completedIcon: {
    fontSize: 48,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  completedDesc: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginVertical: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemTitle: {
    flex: 1,
    fontSize: 12,
    color: '#cbd5e1',
  },
  summaryItemBox: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  returnBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  returnBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
