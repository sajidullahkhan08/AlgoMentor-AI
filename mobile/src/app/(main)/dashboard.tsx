/**
 * Dashboard — Redesigned AlgoMentor AI Command Center.
 *
 * Implements a modern obsidian dark design system inspired by AlgoMaster.io,
 * Linear, and modern mobile developer platforms.
 *
 * Features:
 * - Edge-to-edge custom navigation header with avatar & streak metrics
 * - Active Learning Target & Daily Retrieval hero card
 * - 2x2 Bento Action Hub for quick access to Problems, Visualizers, Voice, and System Design
 * - AlgoMaster Roadmap course tracks with difficulty badges and progress trackers
 * - Platform metrics strip (30 problems, 12 patterns, 6 visualizers, 90 hints)
 * - Persistent modern bottom dock navigation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { fetchCourses, fetchProgressSummary, ProgressSummary } from '@/lib/api';
import { BottomNavBar } from '@/components/BottomNavBar';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

type FilterCategory = 'all' | 'fundamentals' | 'patterns' | 'system_design';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  const loadDashboard = async () => {
    setError(null);
    const [courseResult, progressResult] = await Promise.allSettled([
      fetchCourses(),
      fetchProgressSummary(),
    ]);

    if (courseResult.status === 'fulfilled') {
      setCourses(courseResult.value.courses || []);
    } else {
      setError(courseResult.reason?.message || 'Failed to load courses');
    }

    if (progressResult.status === 'fulfilled') {
      setProgress(progressResult.value);
    } else if (courseResult.status === 'fulfilled') {
      setError(progressResult.reason?.message || 'Failed to load progress');
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const overview = progress?.overview;
  const nextUp = progress?.continueLearning?.[0];
  const weakTopics = progress?.weakTopics || [];
  const recentActivity = progress?.recentActivity || [];
  const courseProgressById = new Map(
    (progress?.courseProgress || []).map((entry) => [entry.courseId, entry])
  );

  const heroPress = () => {
    if ((overview?.dueReviews || 0) > 0) {
      router.push('/(main)/revision/practice');
    } else if (nextUp) {
      router.push(`/(main)/concept/${nextUp.conceptId}` as any);
    } else {
      router.push('/(main)/problems');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of AlgoMentor AI?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const getDifficultyMeta = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return { label: 'Beginner', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'intermediate':
        return { label: 'Intermediate', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'advanced':
        return { label: 'Advanced', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.12)' };
      default:
        return { label: 'All Levels', color: '#818CF8', bg: 'rgba(129, 140, 248, 0.12)' };
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'fundamentals') {
      return course.id.includes('fundamentals') || course.title.toLowerCase().includes('fundamentals');
    }
    if (selectedCategory === 'patterns') {
      return course.id.includes('pattern') || course.title.toLowerCase().includes('pattern');
    }
    if (selectedCategory === 'system_design') {
      return course.id.includes('system') || course.title.toLowerCase().includes('system');
    }
    return true;
  });

  const userInitial = user?.email ? user.email[0].toUpperCase() : 'A';
  const userDisplayName = user?.email ? user.email.split('@')[0] : 'Engineer';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#070A11" />

      {/* Top App Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarGlow}
            onPress={() => router.push('/(main)/profile')}
            activeOpacity={0.8}
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>{userInitial}</Text>
          </TouchableOpacity>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandName}>AlgoMentor</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>AI 2.0</Text>
              </View>
            </View>
            <Text style={styles.greetingText} numberOfLines={1}>
              {userDisplayName}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Gamified Streak Pill */}
          <View style={styles.streakPill}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>{overview?.currentStreakDays ?? 0}d</Text>
          </View>

          {/* Quick Sign Out Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
            accessibilityLabel="Sign Out"
          >
            <Text style={styles.iconButtonText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Canvas */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Mission Card — Daily Invariant Retrieval Target */}
        <TouchableOpacity style={styles.heroCard} onPress={heroPress} activeOpacity={0.88}>
          <View style={styles.heroGlowCorner} />
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillDot}>●</Text>
              <Text style={styles.heroPillText}>
                {(overview?.dueReviews || 0) > 0 ? "TODAY'S RETRIEVAL" : 'CONTINUE LEARNING'}
              </Text>
            </View>
            <Text style={styles.heroSubStat}>
              {overview?.dueReviews || 0} due • {overview?.retentionRatePercent || 0}% retention
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {nextUp ? `${nextUp.recommended ? 'Start' : 'Continue'}: ${nextUp.name}` : 'Build Your Algorithmic Foundation'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {nextUp
              ? `${nextUp.reason}${nextUp.courseTitle ? ` — ${nextUp.courseTitle}` : ''}.`
              : 'Track real mastery, resume active tutoring sessions, and review what is due.'}
          </Text>

          {/* Curriculum mastery progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.max(0, overview?.masteryPercent || 0))}%` },
                ]}
              />
            </View>
            <View style={styles.progressMeta}>
              <Text style={styles.progressLabel}>Curriculum Mastery</Text>
              <Text style={styles.progressValue}>
                {overview?.conceptsMastered || 0}/{overview?.totalConcepts || 0} concepts
              </Text>
            </View>
          </View>

          <View style={styles.heroActionRow}>
            <Text style={styles.heroActionText}>
              {(overview?.dueReviews || 0) > 0
                ? `Review ${overview?.dueReviews} due item${overview?.dueReviews === 1 ? '' : 's'} →`
                : nextUp
                  ? 'Open Concept Studio →'
                  : 'Browse Problems →'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Continue Learning — real active sessions / recommendations */}
        {(progress?.continueLearning?.length || 0) > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Continue Learning</Text>
              <Text style={styles.sectionCaption}>
                {overview?.activeSessions || 0} active session
                {(overview?.activeSessions || 0) === 1 ? '' : 's'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.continueRow}
            >
              {progress!.continueLearning.map((item) => (
                <TouchableOpacity
                  key={item.conceptId}
                  style={styles.continueCard}
                  onPress={() => router.push(`/(main)/concept/${item.conceptId}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.continueBadgeRow}>
                    <View
                      style={[
                        styles.continueBadge,
                        item.recommended && styles.continueBadgeRecommended,
                      ]}
                    >
                      <Text
                        style={[
                          styles.continueBadgeText,
                          item.recommended && styles.continueBadgeTextRecommended,
                        ]}
                      >
                        {item.recommended ? 'RECOMMENDED' : item.masteryState.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <Text style={styles.continueArrow}>→</Text>
                  </View>
                  <Text style={styles.continueTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.continueCourse} numberOfLines={1}>
                    {item.courseTitle}
                  </Text>
                  <Text style={styles.continueReason} numberOfLines={2}>
                    {item.reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Focus Areas — weakest concepts from real mastery evidence */}
        {weakTopics.length > 0 && (
          <View style={styles.focusCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Focus Areas</Text>
              <Text style={styles.sectionCaption}>Lowest evidence first</Text>
            </View>
            {weakTopics.slice(0, 3).map((topic) => (
              <TouchableOpacity
                key={topic.conceptId}
                style={styles.focusRow}
                onPress={() => router.push(`/(main)/concept/${topic.conceptId}` as any)}
                activeOpacity={0.75}
              >
                <View style={styles.focusInfo}>
                  <Text style={styles.focusName} numberOfLines={1}>
                    {topic.name}
                  </Text>
                  <Text style={styles.focusReason} numberOfLines={1}>
                    {topic.reason}
                  </Text>
                  <View style={styles.focusTrack}>
                    <View
                      style={[
                        styles.focusFill,
                        { width: `${Math.min(100, Math.max(0, topic.evidenceScore))}%` },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.focusScoreWrap}>
                  <Text style={styles.focusScore}>{topic.evidenceScore}%</Text>
                  <Text style={styles.focusScoreLabel}>evidence</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bento Hub: 4 Core Learning Engines */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Interactive Studios</Text>
          <Text style={styles.sectionCaption}>Select an algorithmic workspace</Text>
        </View>

        <View style={styles.bentoGrid}>
          {/* Bento 1: Problems & Code Runner */}
          <TouchableOpacity
            style={[styles.bentoCard, styles.bentoCardIndigo]}
            onPress={() => router.push('/(main)/problems')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoTop}>
              <View style={[styles.bentoIconBadge, { backgroundColor: '#312E81' }]}>
                <Text style={styles.bentoIcon}>⚡</Text>
              </View>
              <View style={[styles.bentoMicroBadge, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                <Text style={[styles.bentoMicroText, { color: '#A5B4FC' }]}>
                  {overview?.totalProblems || 0} Problems
                </Text>
              </View>
            </View>
            <Text style={styles.bentoTitle}>Problem Solver</Text>
            <Text style={styles.bentoDesc}>
              {overview?.totalPatterns || 0} core patterns with an isolated test runner & Socratic hints.
            </Text>
            <Text style={[styles.bentoLink, { color: '#818CF8' }]}>Solve Code →</Text>
          </TouchableOpacity>

          {/* Bento 2: Mental Model Visualizers */}
          <TouchableOpacity
            style={[styles.bentoCard, styles.bentoCardEmerald]}
            onPress={() => router.push('/(main)/visualizers')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoTop}>
              <View style={[styles.bentoIconBadge, { backgroundColor: '#064E3B' }]}>
                <Text style={styles.bentoIcon}>🌲</Text>
              </View>
              <View style={[styles.bentoMicroBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Text style={[styles.bentoMicroText, { color: '#6EE7B7' }]}>6 Visualizers</Text>
              </View>
            </View>
            <Text style={styles.bentoTitle}>Mental Models</Text>
            <Text style={styles.bentoDesc}>
              Interactive Trees, Graphs, DP matrices & Big-O curves.
            </Text>
            <Text style={[styles.bentoLink, { color: '#34D399' }]}>Explore Lab →</Text>
          </TouchableOpacity>

          {/* Bento 3: Spoken Reasoning Studio */}
          <TouchableOpacity
            style={[styles.bentoCard, styles.bentoCardViolet]}
            onPress={() => router.push('/(main)/voice')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoTop}>
              <View style={[styles.bentoIconBadge, { backgroundColor: '#4C1D95' }]}>
                <Text style={styles.bentoIcon}>🎙️</Text>
              </View>
              <View style={[styles.bentoMicroBadge, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                <Text style={[styles.bentoMicroText, { color: '#D8B4FE' }]}>Voice AI</Text>
              </View>
            </View>
            <Text style={styles.bentoTitle}>Verbal Studio</Text>
            <Text style={styles.bentoDesc}>
              Practice speaking algorithmic logic aloud with instant feedback.
            </Text>
            <Text style={[styles.bentoLink, { color: '#C084FC' }]}>Speak Invariants →</Text>
          </TouchableOpacity>

          {/* Bento 4: System Design Architecture */}
          <TouchableOpacity
            style={[styles.bentoCard, styles.bentoCardCyan]}
            onPress={() => router.push('/(main)/system-design')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoTop}>
              <View style={[styles.bentoIconBadge, { backgroundColor: '#0E4E63' }]}>
                <Text style={styles.bentoIcon}>🏛️</Text>
              </View>
              <View style={[styles.bentoMicroBadge, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                <Text style={[styles.bentoMicroText, { color: '#67E8F9' }]}>Scale Lab</Text>
              </View>
            </View>
            <Text style={styles.bentoTitle}>System Design</Text>
            <Text style={styles.bentoDesc}>
              TinyURL, Chat & news feeds with back-of-the-envelope math.
            </Text>
            <Text style={[styles.bentoLink, { color: '#38BDF8' }]}>Architect →</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Platform Metrics Banner */}
        <View style={styles.metricsBar}>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{overview?.totalProblems || 0}</Text>
            <Text style={styles.metricLabel}>Problems</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{overview?.conceptsTracked || 0}</Text>
            <Text style={styles.metricLabel}>Concepts</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{overview?.dueReviews || 0}</Text>
            <Text style={styles.metricLabel}>Due Reviews</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{overview?.currentStreakDays || 0}d</Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </View>
        </View>

        {/* AlgoMaster-Inspired Curriculum Roadmap */}
        <View style={styles.roadmapSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>AlgoMaster Curriculum</Text>
            <Text style={styles.sectionCaption}>Master structured learning pathways</Text>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              style={[styles.filterPill, selectedCategory === 'all' && styles.filterPillActive]}
              onPress={() => setSelectedCategory('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategory === 'all' && styles.filterPillTextActive,
                ]}
              >
                All Pathways
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedCategory === 'fundamentals' && styles.filterPillActive]}
              onPress={() => setSelectedCategory('fundamentals')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategory === 'fundamentals' && styles.filterPillTextActive,
                ]}
              >
                🧱 Fundamentals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedCategory === 'patterns' && styles.filterPillActive]}
              onPress={() => setSelectedCategory('patterns')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategory === 'patterns' && styles.filterPillTextActive,
                ]}
              >
                ⚡ 15 Patterns
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedCategory === 'system_design' && styles.filterPillActive]}
              onPress={() => setSelectedCategory('system_design')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategory === 'system_design' && styles.filterPillTextActive,
                ]}
              >
                🏛️ System Design
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Courses List */}
          {loading ? (
            <ActivityIndicator size="large" color="#6366F1" style={styles.loader} />
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
                <Text style={styles.retryText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          ) : filteredCourses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No pathways found in this category.</Text>
            </View>
          ) : (
            filteredCourses.map((course, idx) => {
              const meta = getDifficultyMeta(course.difficulty);
              return (
                <TouchableOpacity
                  key={course.id}
                  style={styles.courseTrackCard}
                  onPress={() => router.push(`/(main)/course/${course.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.courseTrackHeader}>
                    <View style={styles.courseTrackNumberBadge}>
                      <Text style={styles.courseTrackNumber}>0{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseTrackTitle}>{course.title}</Text>
                      <View style={styles.courseMetaRow}>
                        <View style={[styles.difficultyBadge, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.difficultyText, { color: meta.color }]}>
                            {meta.label}
                          </Text>
                        </View>
                        <Text style={styles.courseCurriculumTag}>• Roadmap Track</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.courseTrackDesc}>{course.description}</Text>

                  {courseProgressById.get(course.id) && (
                    <View style={styles.courseProgressWrap}>
                      <View style={styles.courseProgressTrack}>
                        <View
                          style={[
                            styles.courseProgressFill,
                            {
                              width: `${Math.min(
                                100,
                                Math.max(0, courseProgressById.get(course.id)!.masteryPercent)
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.courseProgressText}>
                        {courseProgressById.get(course.id)!.masteredConcepts}/
                        {courseProgressById.get(course.id)!.totalConcepts} concepts mastered
                        {'  •  '}
                        {courseProgressById.get(course.id)!.trackedConcepts} started
                      </Text>
                    </View>
                  )}

                  <View style={styles.courseTrackFooter}>
                    <Text style={styles.courseTrackCta}>Explore Modules & Concepts →</Text>
                    <Text style={styles.courseTrackChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Recent Activity — tutoring, problem attempts, and revisions */}
        {recentActivity.length > 0 && (
          <View style={styles.activityCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Text style={styles.sectionCaption}>Your latest practice</Text>
            </View>
            {recentActivity.slice(0, 5).map((item, index) => (
              <View
                key={`${item.type}-${item.timestamp}-${index}`}
                style={[styles.activityRow, index > 0 && styles.activityRowBorder]}
              >
                <View
                  style={[
                    styles.activityIconBadge,
                    item.type === 'problem'
                      ? styles.activityIconProblem
                      : item.type === 'revision'
                        ? styles.activityIconRevision
                        : styles.activityIconTutoring,
                  ]}
                >
                  <Text style={styles.activityIcon}>
                    {item.type === 'problem' ? '⚡' : item.type === 'revision' ? '🔁' : '🧠'}
                  </Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.activityDetail} numberOfLines={1}>
                    {item.detail}
                  </Text>
                </View>
                <Text style={styles.activityDate}>
                  {new Date(item.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Spaced Retrieval Queue Quick Banner */}
        <TouchableOpacity
          style={styles.revisionFooterCard}
          onPress={() => router.push('/(main)/revision')}
          activeOpacity={0.8}
        >
          <View style={styles.revisionFooterLeft}>
            <Text style={styles.revisionFooterIcon}>🔁</Text>
            <View style={styles.revisionFooterTextWrap}>
              <Text style={styles.revisionFooterTitle}>Spaced Repetition & Retention</Text>
              <Text style={styles.revisionFooterSub}>
                {overview?.dueReviews || 0} due now • {overview?.retentionRatePercent || 0}% retention
                • Leitner 5-box intervals
              </Text>
            </View>
          </View>
          <Text style={styles.revisionFooterAction}>Open →</Text>
        </TouchableOpacity>

        {/* Bottom Padding for Dock */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modern Persistent Bottom Dock */}
      <BottomNavBar activeTab="roadmap" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070A11',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: '#070A11',
    borderBottomWidth: 1,
    borderBottomColor: '#141A29',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E0E7FF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  proBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
  },
  greetingText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1810',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#78350F',
    gap: 4,
  },
  streakIcon: {
    fontSize: 13,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111726',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  iconButtonText: {
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  heroCard: {
    backgroundColor: '#0F1527',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#3730A3',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlowCorner: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  heroPillDot: {
    fontSize: 8,
    color: '#818CF8',
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C7D2FE',
    letterSpacing: 0.5,
  },
  heroSubStat: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 11,
    color: '#A5B4FC',
    fontWeight: '700',
  },
  heroActionRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  heroActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A5B4FC',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  sectionCaption: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'right',
    flexShrink: 1,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  continueRow: {
    gap: 10,
    paddingRight: 16,
  },
  continueCard: {
    width: 210,
    backgroundColor: '#0E1322',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2B45',
    gap: 5,
  },
  continueBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  continueBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  continueBadgeRecommended: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  continueBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7DD3FC',
    letterSpacing: 0.3,
  },
  continueBadgeTextRecommended: {
    color: '#6EE7B7',
  },
  continueArrow: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 18,
  },
  continueCourse: {
    fontSize: 11,
    color: '#818CF8',
    fontWeight: '600',
  },
  continueReason: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  focusCard: {
    backgroundColor: '#0E1322',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3B2A1A',
    marginBottom: 24,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1C2436',
  },
  focusInfo: {
    flex: 1,
    gap: 3,
  },
  focusName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  focusReason: {
    fontSize: 11,
    color: '#94A3B8',
  },
  focusTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    marginTop: 3,
  },
  focusFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  focusScoreWrap: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  focusScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FBBF24',
  },
  focusScoreLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#0E1322',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1C2436',
    marginBottom: 20,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  activityRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#172033',
  },
  activityIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconTutoring: {
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  activityIconProblem: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  activityIconRevision: {
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
  },
  activityIcon: {
    fontSize: 14,
  },
  activityInfo: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  activityDetail: {
    fontSize: 11,
    color: '#64748B',
  },
  activityDate: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  courseProgressWrap: {
    gap: 5,
    marginBottom: 12,
  },
  courseProgressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  courseProgressText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  revisionFooterTextWrap: {
    flex: 1,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  bentoCard: {
    width: '48%',
    backgroundColor: '#0E1322',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  bentoCardIndigo: {
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  bentoCardEmerald: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  bentoCardViolet: {
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  bentoCardCyan: {
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  bentoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bentoIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoIcon: {
    fontSize: 16,
  },
  bentoMicroBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bentoMicroText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bentoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  bentoDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    marginBottom: 8,
  },
  bentoLink: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D121F',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1A2338',
    marginBottom: 24,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1E293B',
  },
  roadmapSection: {
    marginBottom: 20,
  },
  filterScrollView: {
    marginBottom: 14,
  },
  filterContainer: {
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#0F1524',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  filterPillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterPillTextActive: {
    color: '#E0E7FF',
    fontWeight: '700',
  },
  courseTrackCard: {
    backgroundColor: '#0E1322',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1C2436',
    marginBottom: 12,
  },
  courseTrackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  courseTrackNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#172033',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#26334F',
  },
  courseTrackNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#818CF8',
  },
  courseTrackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  courseCurriculumTag: {
    fontSize: 11,
    color: '#64748B',
  },
  courseTrackDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  courseTrackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#172033',
  },
  courseTrackCta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818CF8',
  },
  courseTrackChevron: {
    fontSize: 16,
    color: '#818CF8',
    fontWeight: '800',
  },
  loader: {
    marginTop: 24,
  },
  errorCard: {
    backgroundColor: '#1E1218',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: '#0E1322',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  revisionFooterCard: {
    backgroundColor: '#140D1B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4A1D66',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  revisionFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  revisionFooterIcon: {
    fontSize: 22,
  },
  revisionFooterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  revisionFooterSub: {
    fontSize: 11,
    color: '#A855F7',
    marginTop: 1,
  },
  revisionFooterAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C084FC',
    marginLeft: 8,
  },
});
