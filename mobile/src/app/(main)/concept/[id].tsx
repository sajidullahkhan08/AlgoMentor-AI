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
    backgroundColor: '#0F0F23',
  },
  errorText: {
    color: '#E17055',
    fontSize: 16,
  },
  header: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 15,
    color: '#A0A0B8',
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  objectivesList: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  objectiveItem: {
    flexDirection: 'row',
    gap: 8,
  },
  objectiveBullet: {
    color: '#6C5CE7',
    fontSize: 14,
    marginTop: 1,
  },
  objectiveText: {
    fontSize: 14,
    color: '#DDDDF0',
    lineHeight: 20,
    flex: 1,
  },
  prereqList: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  prereqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  prereqName: {
    fontSize: 14,
    color: '#DDDDF0',
    flex: 1,
  },
  prereqDifficulty: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  stateCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  stateLabel: {
    fontSize: 13,
    color: '#A0A0B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stateValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#A0A0B8',
  },
  stateHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: '#0F0F23',
    borderTopWidth: 1,
    borderTopColor: '#1A1A2E',
  },
  startButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
