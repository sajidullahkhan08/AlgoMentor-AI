/**
 * System Design Catalog Screen (Phase 9).
 *
 * Displays distributed system design scenarios, scale metrics,
 * architectural categories, and links to the Architecture Studio.
 */

import React, { useEffect, useState } from 'react';
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
import { fetchSystemDesignScenarios, SystemDesignScenario } from '../../../lib/api';

export default function SystemDesignIndexScreen() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<SystemDesignScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const data = await fetchSystemDesignScenarios();
      setScenarios(data || []);
    } catch (err: any) {
      console.error('[SystemDesign] Failed to load scenarios:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadScenarios();
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'advanced':
        return '#f43f5e';
      default:
        return '#64748b';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading distributed system design curriculum...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" />
        }
      >
        {/* Banner */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>System Design Studio 🏛️</Text>
          <Text style={styles.headerSubtitle}>
            Master high-throughput distributed architectures, back-of-the-envelope calculations,
            and Socratic trade-off evaluations at production scale.
          </Text>
        </View>

        {/* Scenarios List */}
        <Text style={styles.sectionHeading}>Production Architecture Scenarios</Text>

        {scenarios.map((sc) => {
          const diffColor = getDifficultyColor(sc.difficulty);
          return (
            <TouchableOpacity
              key={sc.id}
              style={styles.scenarioCard}
              onPress={() => router.push(`/(main)/system-design/${sc.slug}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.scenarioCardHeader}>
                <View style={[styles.diffBadge, { backgroundColor: diffColor + '20', borderColor: diffColor }]}>
                  <Text style={[styles.diffBadgeText, { color: diffColor }]}>
                    {sc.difficulty.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.categoryText}>{sc.category}</Text>
              </View>

              <Text style={styles.scenarioTitle}>{sc.title}</Text>
              <Text style={styles.scenarioDesc}>{sc.description}</Text>

              {/* Scale Metrics Pill Row */}
              <View style={styles.metricsRow}>
                {Object.entries(sc.scale_metrics).slice(0, 3).map(([key, val], idx) => (
                  <View key={idx} style={styles.metricPill}>
                    <Text style={styles.metricLabel}>{key.replace(/_/g, ' ')}:</Text>
                    <Text style={styles.metricVal} numberOfLines={1}>{val}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.componentsCountText}>
                  {sc.architecture_components.length} Core Tiers • {sc.trade_off_questions.length} Trade-Offs
                </Text>
                <Text style={styles.openStudioAction}>Open Architecture Studio ➔</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
  headerBanner: {
    backgroundColor: '#082f49',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#bae6fd',
    lineHeight: 19,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 14,
  },
  scenarioCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  scenarioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  categoryText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  scenarioTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  scenarioDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metricPill: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '700',
    maxWidth: 160,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginTop: 4,
  },
  componentsCountText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  openStudioAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
});
