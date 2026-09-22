import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import {
  fetchProblems,
  fetchPatterns,
  Problem,
  Pattern,
} from '../../../lib/api';

export default function ProblemsScreen() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'problems' | 'patterns'>('problems');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [problemsRes, patternsRes] = await Promise.all([
        fetchProblems(),
        fetchPatterns(),
      ]);
      setProblems(problemsRes.problems || []);
      setPatterns(patternsRes.patterns || []);
    } catch (err) {
      console.error('Failed to load problems or patterns:', err);
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

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff =
      selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    const matchesPattern =
      selectedPatternId === 'all' ||
      p.patterns?.some((pat) => pat.id === selectedPatternId);

    return matchesSearch && matchesDiff && matchesPattern;
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>DSA Problem Solving</Text>
          <Text style={styles.headerSubtitle}>
            Pattern-first algorithmic mastery with Socratic guidance
          </Text>
        </View>
      </View>

      {/* Mode Switcher Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'problems' && styles.tabItemActive]}
          onPress={() => setActiveTab('problems')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'problems' && styles.tabTextActive,
            ]}
          >
            Problems ({problems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'patterns' && styles.tabItemActive]}
          onPress={() => setActiveTab('patterns')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'patterns' && styles.tabTextActive,
            ]}
          >
            DSA Patterns ({patterns.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'problems' ? (
        <>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search problems or patterns..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Difficulty Filter Chips */}
          <View style={styles.filterRow}>
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.filterChip,
                  selectedDifficulty === diff && styles.filterChipActive,
                ]}
                onPress={() => setSelectedDifficulty(diff)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedDifficulty === diff && styles.filterChipTextActive,
                  ]}
                >
                  {diff.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pattern Filter Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.patternScroll}
          >
            <TouchableOpacity
              style={[
                styles.patternPill,
                selectedPatternId === 'all' && styles.patternPillActive,
              ]}
              onPress={() => setSelectedPatternId('all')}
            >
              <Text
                style={[
                  styles.patternPillText,
                  selectedPatternId === 'all' && styles.patternPillTextActive,
                ]}
              >
                All Patterns
              </Text>
            </TouchableOpacity>
            {patterns.map((pat) => (
              <TouchableOpacity
                key={pat.id}
                style={[
                  styles.patternPill,
                  selectedPatternId === pat.id && styles.patternPillActive,
                ]}
                onPress={() => setSelectedPatternId(pat.id)}
              >
                <Text
                  style={[
                    styles.patternPillText,
                    selectedPatternId === pat.id && styles.patternPillTextActive,
                  ]}
                >
                  {pat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Problem List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading curated problems...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProblems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#3b82f6"
                />
              }
              renderItem={({ item }) => {
                const latestAttempt = item.attempts?.[0];
                const isPassed = latestAttempt?.status === 'passed';

                return (
                  <TouchableOpacity
                    style={styles.problemCard}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/(main)/problems/[id]',
                        params: { id: item.id },
                      } as any)
                    }
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.titleRow}>
                        <Text style={styles.problemTitle}>{item.title}</Text>
                        {isPassed && (
                          <View style={styles.statusSolvedBadge}>
                            <Text style={styles.statusSolvedText}>✓ Solved</Text>
                          </View>
                        )}
                      </View>
                      <View
                        style={[
                          styles.diffBadge,
                          {
                            borderColor: getDifficultyColor(item.difficulty),
                            backgroundColor: `${getDifficultyColor(
                              item.difficulty
                            )}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.diffBadgeText,
                            { color: getDifficultyColor(item.difficulty) },
                          ]}
                        >
                          {item.difficulty.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.problemDesc} numberOfLines={2}>
                      {item.description}
                    </Text>

                    {/* Associated Patterns & Concepts */}
                    <View style={styles.tagContainer}>
                      {item.patterns?.map((pat) => (
                        <View key={pat.id} style={styles.patternTag}>
                          <Text style={styles.patternTagText}>⚡ {pat.name}</Text>
                        </View>
                      ))}
                      {item.concepts?.map((c) => (
                        <View key={c.id} style={styles.conceptTag}>
                          <Text style={styles.conceptTagText}>🧠 {c.name}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyTitle}>No problems match filters</Text>
                  <Text style={styles.emptySubtitle}>
                    Try clearing filters or search query.
                  </Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        /* Patterns Explorer Tab */
        <FlatList
          data={patterns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.patternCard}>
              <View style={styles.patternCardHeader}>
                <Text style={styles.patternCardTitle}>⚡ {item.name}</Text>
                <View style={styles.complexityPill}>
                  <Text style={styles.complexityPillText}>
                    {item.time_complexity_optimal || 'O(log n)'}
                  </Text>
                </View>
              </View>

              <Text style={styles.patternCardDesc}>{item.description}</Text>

              {/* Recognition signals */}
              <View style={styles.signalBox}>
                <Text style={styles.signalBoxTitle}>
                  🔍 Pattern Recognition Signals:
                </Text>
                {item.recognition_signals?.map((signal, idx) => (
                  <Text key={idx} style={styles.signalItem}>
                    • {signal}
                  </Text>
                ))}
              </View>

              {/* Invariants */}
              {item.key_invariants && item.key_invariants.length > 0 && (
                <View style={styles.invariantBox}>
                  <Text style={styles.invariantBoxTitle}>
                    🛡️ Algorithmic Invariants:
                  </Text>
                  {item.key_invariants.map((inv, idx) => (
                    <Text key={idx} style={styles.invariantItem}>
                      • {inv}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.viewProblemsBtn}
                onPress={() => {
                  setSelectedPatternId(item.id);
                  setActiveTab('problems');
                }}
              >
                <Text style={styles.viewProblemsBtnText}>
                  Explore Problems Using This Pattern →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
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
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  patternScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 10,
  },
  patternPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  patternPillActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c4a6e',
  },
  patternPillText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  patternPillTextActive: {
    color: '#38bdf8',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  problemCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusSolvedBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusSolvedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  problemDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  patternTag: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  patternTagText: {
    fontSize: 11,
    color: '#a5b4fc',
    fontWeight: '600',
  },
  conceptTag: {
    backgroundColor: '#172554',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conceptTagText: {
    fontSize: 11,
    color: '#93c5fd',
    fontWeight: '500',
  },
  patternCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  patternCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
    flex: 1,
  },
  complexityPill: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  complexityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e0f2fe',
    fontFamily: 'monospace',
  },
  patternCardDesc: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  signalBox: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  signalBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 4,
  },
  signalItem: {
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 18,
  },
  invariantBox: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  invariantBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 4,
  },
  invariantItem: {
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 18,
  },
  viewProblemsBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  viewProblemsBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
});
