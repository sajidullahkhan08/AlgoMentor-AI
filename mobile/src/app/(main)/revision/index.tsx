/**
 * Revision & Spaced Repetition Screen (Phase 8).
 *
 * Visualizes:
 * - 5-Box Leitner distribution
 * - Retention rate and review streak
 * - Active retrieval queue (due today vs upcoming)
 * - Navigation to retrieval session
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchRevisionQueue,
  fetchRevisionStats,
  RevisionItem,
  RevisionStats,
} from '../../../lib/api';

export default function RevisionIndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [dueItems, setDueItems] = useState<RevisionItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<RevisionItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [queueData, statsData] = await Promise.all([
        fetchRevisionQueue(),
        fetchRevisionStats(),
      ]);
      setDueItems(queueData.dueItems || []);
      setUpcomingItems(queueData.upcomingItems || []);
      setStats(statsData);
    } catch (err: any) {
      console.error('[Revision] Failed to load queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getBoxColor = (box: number) => {
    switch (box) {
      case 1:
        return '#f43f5e'; // Red (Daily)
      case 2:
        return '#f97316'; // Orange (2-3 days)
      case 3:
        return '#eab308'; // Yellow (1 week)
      case 4:
        return '#3b82f6'; // Blue (2-3 weeks)
      case 5:
        return '#10b981'; // Green (Mastered / Long-term)
      default:
        return '#64748b';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Calculating SM-2 memory curves...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
      >
        {/* Header Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Retention</Text>
              <Text style={styles.statValue}>
                {stats?.retentionRatePercent ?? 85}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Review Streak</Text>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                🔥 {stats?.currentStreakDays ?? 3}d
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Mastered</Text>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {stats?.masteredCount ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Leitner 5-Box Distribution */}
        <Text style={styles.sectionTitle}>Leitner Memory Boxes</Text>
        <Text style={styles.sectionSubtitle}>
          Items advance through 5 spaced intervals. Retrieval failures reset items to Box 1.
        </Text>
        <View style={styles.leitnerBoxesRow}>
          {[1, 2, 3, 4, 5].map((box) => {
            const count = stats?.boxDistribution?.[box] || 0;
            const color = getBoxColor(box);
            return (
              <View
                key={box}
                style={[
                  styles.boxCard,
                  { borderColor: color + '55', backgroundColor: color + '15' },
                ]}
              >
                <Text style={[styles.boxNumber, { color }]}>Box {box}</Text>
                <Text style={styles.boxCount}>{count}</Text>
                <Text style={styles.boxCadence}>
                  {box === 1
                    ? '1d'
                    : box === 2
                    ? '3d'
                    : box === 3
                    ? '1w'
                    : box === 4
                    ? '2w'
                    : '1mo'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Start Retrieval Practice Action Banner */}
        <View style={styles.actionBanner}>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>
              {dueItems.length > 0
                ? `⚡ ${dueItems.length} Algorithmic Invariants Due`
                : '✨ Memory Up To Date!'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {dueItems.length > 0
                ? 'Active recall solidifies neural pathways before memory decay occurs.'
                : 'You have cleared all pending items. Review upcoming invariants to pull them forward.'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.startPracticeBtn}
            onPress={() => router.push('/(main)/revision/practice' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.startPracticeBtnText}>
              {dueItems.length > 0 ? 'Start Retrieval Session ➔' : 'Practice Upcoming Invariants ➔'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items Due Section */}
        <Text style={styles.sectionTitle}>Due for Review ({dueItems.length})</Text>
        {dueItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>Queue Cleared!</Text>
            <Text style={styles.emptyDesc}>
              No items currently past their spaced interval. Keep up the high retention!
            </Text>
          </View>
        ) : (
          dueItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemCardHeader}>
                <View
                  style={[
                    styles.boxBadge,
                    {
                      backgroundColor: getBoxColor(item.leitner_box) + '25',
                      borderColor: getBoxColor(item.leitner_box),
                    },
                  ]}
                >
                  <Text
                    style={[styles.boxBadgeText, { color: getBoxColor(item.leitner_box) }]}
                  >
                    Box {item.leitner_box}
                  </Text>
                </View>
                <Text style={styles.itemTypeBadge}>{item.item_type.toUpperCase()}</Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemPrompt} numberOfLines={2}>
                {item.prompt_question}
              </Text>
              <View style={styles.itemFooter}>
                <Text style={styles.intervalText}>
                  Interval: {item.interval_days}d • Reps: {item.repetition_count}
                </Text>
                <Text style={styles.dueAlert}>Due for Recall</Text>
              </View>
            </View>
          ))
        )}

        {/* Upcoming Items Section */}
        {upcomingItems.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Upcoming Invariants ({upcomingItems.length})
            </Text>
            {upcomingItems.map((item) => (
              <View key={item.id} style={[styles.itemCard, { opacity: 0.85 }]}>
                <View style={styles.itemCardHeader}>
                  <View
                    style={[
                      styles.boxBadge,
                      {
                        backgroundColor: getBoxColor(item.leitner_box) + '20',
                        borderColor: getBoxColor(item.leitner_box),
                      },
                    ]}
                  >
                    <Text
                      style={[styles.boxBadgeText, { color: getBoxColor(item.leitner_box) }]}
                    >
                      Box {item.leitner_box}
                    </Text>
                  </View>
                  <Text style={styles.itemTypeBadge}>{item.item_type.toUpperCase()}</Text>
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemPrompt} numberOfLines={2}>
                  {item.prompt_question}
                </Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.intervalText}>
                    Interval: {item.interval_days}d • Reps: {item.repetition_count}
                  </Text>
                  <Text style={styles.upcomingDate}>
                    Next: {new Date(item.next_review_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
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
    padding: 20,
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
    paddingBottom: 60,
  },
  statsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#1e293b',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  leitnerBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 6,
  },
  boxCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  boxNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  boxCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginVertical: 2,
  },
  boxCadence: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  actionBanner: {
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    gap: 14,
  },
  actionInfo: {
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#c7d2fe',
    lineHeight: 17,
  },
  startPracticeBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startPracticeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  itemCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  boxBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  itemPrompt: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  intervalText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  dueAlert: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f43f5e',
  },
  upcomingDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
  },
  emptyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
