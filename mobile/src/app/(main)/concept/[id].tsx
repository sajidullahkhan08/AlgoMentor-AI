/**
 * Concept detail screen.
 *
 * Shows concept information, learning objectives, prerequisites,
 * and the "Start Learning" button that will initiate a tutor session.
 *
 * This is the entry point into the vertical slice:
 * Select Concept → Start Tutor Session → Tutor asks → Student responds →
 * Tutor evaluates → Knowledge state updates → Next interaction
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { fetchConcept, fetchPrerequisites, startTutorSession } from '@/lib/api';

interface ConceptDetail {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  learning_objectives: string[];
}

interface Prerequisite {
  id: string;
  name: string;
  relationship_type: string;
  difficulty?: string;
}

export default function ConceptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [concept, setConcept] = useState<ConceptDetail | null>(null);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadConceptData(id);
    }
  }, [id]);

  const loadConceptData = async (conceptId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [conceptData, prereqData] = await Promise.all([
        fetchConcept(conceptId),
        fetchPrerequisites(conceptId),
      ]);
      setConcept(conceptData);
      setPrerequisites(prereqData.prerequisites || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load concept');
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = async () => {
    if (!concept?.id) return;
    try {
      setStartingSession(true);
      const sessionData = await startTutorSession(concept.id);
      router.push(`/(main)/tutor/${sessionData.session.id}` as any);
    } catch (err: any) {
      Alert.alert('Session Error', err.message || 'Failed to start tutor session');
    } finally {
      setStartingSession(false);
    }
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  if (error || !concept) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Concept not found'}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: concept.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Concept header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{concept.name}</Text>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(concept.difficulty) + '22' },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: getDifficultyColor(concept.difficulty) },
                ]}
              >
                {concept.difficulty}
              </Text>
            </View>
          </View>
          {concept.description && (
            <Text style={styles.description}>{concept.description}</Text>
          )}
        </View>

        {/* Relevant Interactive Visualizer Link */}
        {(() => {
          const lower = concept.name.toLowerCase();
          let visualizerInfo: { type: string; label: string } | null = null;
          if (lower.includes('binary search') || lower.includes('search space')) {
            visualizerInfo = { type: 'array_search', label: 'Binary Search Invariant Tracer' };
          } else if (lower.includes('big-o') || lower.includes('complexity') || lower.includes('logarithmic')) {
            visualizerInfo = { type: 'complexity', label: 'Big-O Growth Rate Simulator' };
          } else if (lower.includes('array')) {
            visualizerInfo = { type: 'two_pointers', label: 'Two-Pointer & Sliding Window Visualizer' };
          }

          if (!visualizerInfo) return null;

          return (
            <TouchableOpacity
              style={styles.visualizerCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(main)/visualizers/[type]',
                  params: { type: visualizerInfo!.type },
                } as any)
              }
            >
              <View style={styles.visualizerCardHeader}>
                <Text style={styles.visualizerCardBadge}>✨ Interactive Mental Model</Text>
                <Text style={styles.visualizerCardArrow}>Launch ➔</Text>
              </View>
              <Text style={styles.visualizerCardTitle}>{visualizerInfo.label}</Text>
              <Text style={styles.visualizerCardSub}>
                Interact with the visual invariant diagram for this concept
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Learning objectives */}
        {concept.learning_objectives && concept.learning_objectives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Learning Objectives</Text>
            <View style={styles.objectivesList}>
              {concept.learning_objectives.map((obj, i) => (
                <View key={i} style={styles.objectiveItem}>
                  <Text style={styles.objectiveBullet}>•</Text>
                  <Text style={styles.objectiveText}>{obj}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Prerequisites</Text>
            <View style={styles.prereqList}>
              {prerequisites.map((prereq) => (
                <View key={prereq.id} style={styles.prereqItem}>
                  <Text style={styles.prereqName}>{prereq.name}</Text>
                  <Text
                    style={[
                      styles.prereqDifficulty,
                      { color: getDifficultyColor(prereq.difficulty || 'beginner') },
                    ]}
                  >
                    {prereq.difficulty || prereq.relationship_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Knowledge state placeholder */}
        <View style={styles.stateCard}>
          <Text style={styles.stateLabel}>Your Mastery</Text>
          <Text style={styles.stateValue}>UNKNOWN</Text>
          <Text style={styles.stateHint}>
            Start a tutoring session to begin building understanding
          </Text>
        </View>
      </ScrollView>

      {/* Start learning button — fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, startingSession && { opacity: 0.7 }]}
          onPress={handleStartLearning}
          activeOpacity={0.8}
          disabled={startingSession}
        >
          {startingSession ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.startButtonText}>🧠 Start Learning</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070A11',
  },
  errorText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    gap: 10,
    backgroundColor: '#0E1322',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C2436',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: -0.4,
  },
  difficultyBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 21,
  },
  section: {
    gap: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  objectivesList: {
    backgroundColor: '#0E1322',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1C2436',
  },
  objectiveItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  objectiveBullet: {
    color: '#818CF8',
    fontSize: 14,
    marginTop: 1,
    fontWeight: '700',
  },
  objectiveText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
    flex: 1,
  },
  prereqList: {
    backgroundColor: '#0E1322',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1C2436',
  },
  prereqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#172033',
  },
  prereqName: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600',
    flex: 1,
  },
  prereqDifficulty: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stateCard: {
    backgroundColor: '#0E1322',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1C2436',
  },
  stateLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  stateValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#818CF8',
  },
  stateHint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingBottom: 32,
    backgroundColor: '#070A11',
    borderTopWidth: 1,
    borderTopColor: '#172033',
  },
  startButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  visualizerCard: {
    backgroundColor: '#0A1C2C',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0284C7',
    marginBottom: 16,
    gap: 4,
  },
  visualizerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  visualizerCardBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  visualizerCardArrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  visualizerCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  visualizerCardSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
