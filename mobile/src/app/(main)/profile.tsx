/**
 * Profile & progress screen.
 *
 * Shows the learner's identity, editable preferences (profiles/me), and the
 * aggregated progress summary. Reached from the dashboard avatar.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import {
  fetchProfile,
  fetchProgressSummary,
  updateProfile,
  ProgressSummary,
} from '@/lib/api';

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];
const LANGUAGES = ['javascript', 'python', 'java', 'cpp'];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [preferredLanguage, setPreferredLanguage] = useState('javascript');
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [profileResult, progressResult] = await Promise.allSettled([
      fetchProfile(),
      fetchProgressSummary(),
    ]);

    if (profileResult.status === 'fulfilled') {
      const profile = profileResult.value;
      setDisplayName(profile.display_name || '');
      setExperienceLevel(profile.experience_level || 'beginner');
      setPreferredLanguage(profile.preferred_language || 'javascript');
    } else {
      setError(profileResult.reason?.message || 'Failed to load profile');
    }

    if (progressResult.status === 'fulfilled') {
      setProgress(progressResult.value);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        display_name: displayName.trim() || undefined,
        experience_level: experienceLevel,
        preferred_language: preferredLanguage,
      });
      Alert.alert('Saved', 'Your learner profile has been updated.');
    } catch (err: any) {
      Alert.alert('Save failed', err.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of AlgoMentor AI?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const initial = (displayName || user?.email || 'A')[0].toUpperCase();
  const overview = progress?.overview;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Profile & Progress' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        <StatusBar barStyle="light-content" backgroundColor="#070A11" />

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.name}>{displayName || user?.email?.split('@')[0] || 'Engineer'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{experienceLevel}</Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {overview?.conceptsMastered || 0}/{overview?.totalConcepts || 0}
            </Text>
            <Text style={styles.statLabel}>Concepts Mastered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {overview?.problemsSolved || 0}/{overview?.totalProblems || 0}
            </Text>
            <Text style={styles.statLabel}>Problems Solved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overview?.currentStreakDays || 0}d</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overview?.retentionRatePercent || 0}%</Text>
            <Text style={styles.statLabel}>Retention</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learner Profile</Text>

          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How should we address you?"
            placeholderTextColor="#475569"
            maxLength={60}
          />

          <Text style={styles.fieldLabel}>Experience level</Text>
          <View style={styles.chipRow}>
            {EXPERIENCE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.chip, experienceLevel === level && styles.chipActive]}
                onPress={() => setExperienceLevel(level)}
              >
                <Text
                  style={[styles.chipText, experienceLevel === level && styles.chipTextActive]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Preferred language</Text>
          <View style={styles.chipRow}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.chip, preferredLanguage === lang && styles.chipActive]}
                onPress={() => setPreferredLanguage(lang)}
              >
                <Text
                  style={[styles.chipText, preferredLanguage === lang && styles.chipTextActive]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Progress</Text>
          {(progress?.courseProgress || []).map((course) => (
            <TouchableOpacity
              key={course.courseId}
              style={styles.courseRow}
              onPress={() => router.push(`/(main)/course/${course.courseId}` as any)}
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseMeta}>
                  {course.masteredConcepts}/{course.totalConcepts} mastered •{' '}
                  {course.trackedConcepts} started
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${course.masteryPercent}%` }]} />
                </View>
              </View>
              <Text style={styles.coursePercent}>{course.masteryPercent}%</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070A11',
  },
  content: {
    padding: 18,
    gap: 18,
  },
  centered: {
    flex: 1,
    backgroundColor: '#070A11',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0E1322',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1C2436',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1E1B4B',
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E0E7FF',
  },
  identityInfo: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  email: {
    fontSize: 12,
    color: '#94A3B8',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5B4FC',
    textTransform: 'capitalize',
  },
  errorCard: {
    backgroundColor: '#1E1218',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    gap: 6,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
  },
  retryText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#0E1322',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1C2436',
    gap: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#0E1322',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1C2436',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 6,
  },
  input: {
    backgroundColor: '#070A11',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#070A11',
  },
  chipActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  chipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#E0E7FF',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#172033',
  },
  courseInfo: {
    flex: 1,
    gap: 3,
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  courseMeta: {
    fontSize: 10,
    color: '#64748B',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    marginTop: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#6366F1',
  },
  coursePercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#818CF8',
  },
  signOutButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: 'rgba(127, 29, 29, 0.15)',
    paddingVertical: 13,
    alignItems: 'center',
  },
  signOutText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
});
