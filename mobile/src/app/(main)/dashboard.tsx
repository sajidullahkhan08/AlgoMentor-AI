/**
 * Dashboard — main landing screen after login.
 *
 * Shows a welcome message, course list, and sign-out button.
 * This is the entry point into the curriculum browsing flow.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { fetchCourses } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      setError(null);
      const data = await fetchCourses();
      setCourses(data.courses || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#00B894';
      case 'intermediate':
        return '#FDCB6E';
      case 'advanced':
        return '#E17055';
      default:
        return '#A0A0B8';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* Welcome section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.tagline}>
            Make responding easy. Make thinking unavoidable.
          </Text>
        </View>

        {/* DSA Patterns & Problem Solving Banner */}
        <TouchableOpacity
          style={styles.problemBannerCard}
          onPress={() => router.push('/(main)/problems/index' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.problemBannerHeader}>
            <View style={styles.problemIconBadge}>
              <Text style={styles.problemIcon}>⚡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.problemBannerTitle}>DSA Problem Solving</Text>
              <Text style={styles.problemBannerSubtitle}>
                Master algorithmic patterns & LeetCode problems with Socratic AI feedback
              </Text>
            </View>
          </View>
          <View style={styles.problemBannerFooter}>
            <Text style={styles.problemBannerAction}>Solve Problems & Trace Invariants →</Text>
          </View>
        </TouchableOpacity>

        {/* Courses section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Courses</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#6C5CE7" style={styles.loader} />
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadCourses}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : courses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No courses available yet.</Text>
              <Text style={styles.emptySubtext}>
                Run the seed migration to add the DSA curriculum.
              </Text>
            </View>
          ) : (
            courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => router.push(`/(main)/course/${course.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.courseHeader}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(course.difficulty) + '22' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(course.difficulty) },
                      ]}
                    >
                      {course.difficulty}
                    </Text>
                  </View>
                </View>
                {course.description && (
                  <Text style={styles.courseDescription}>{course.description}</Text>
                )}
                <Text style={styles.courseAction}>Explore modules →</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sign out */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  welcomeCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#A0A0B8',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 14,
    color: '#6C5CE7',
    fontStyle: 'italic',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  loader: {
    marginTop: 40,
  },
  errorCard: {
    backgroundColor: '#2D1B1B',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#E17055',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#A0A0B8',
    fontSize: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
  courseCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    gap: 8,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  courseDescription: {
    fontSize: 14,
    color: '#A0A0B8',
    lineHeight: 20,
  },
  courseAction: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '500',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#1A1A2E',
  },
  signOutButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  signOutText: {
    color: '#A0A0B8',
    fontSize: 16,
    fontWeight: '500',
  },
  problemBannerCard: {
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#1d4ed8',
  },
  problemBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  problemIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemIcon: {
    fontSize: 22,
  },
  problemBannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  problemBannerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  problemBannerFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  problemBannerAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
});
