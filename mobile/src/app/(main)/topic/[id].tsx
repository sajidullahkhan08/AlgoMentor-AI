/**
 * Topic detail screen.
 *
 * Shows all concepts within a topic.
 * Tapping a concept navigates to the concept detail screen
 * where the student can start a tutoring session.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { fetchConceptsByTopic } from '@/lib/api';

interface Concept {
  id: string;
  name: string;
  description: string;
  difficulty: string;
}

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConcepts();
  }, [id]);

  const loadConcepts = async () => {
    try {
      setError(null);
      const data = await fetchConceptsByTopic(id!);
      setConcepts(data.concepts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load concepts');
    } finally {
      setLoading(false);
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

  return (
    <>
      <Stack.Screen options={{ title: 'Topic' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Concepts</Text>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : concepts.length === 0 ? (
          <Text style={styles.emptyText}>No concepts in this topic yet.</Text>
        ) : (
          concepts.map((concept) => (
            <TouchableOpacity
              key={concept.id}
              style={styles.conceptCard}
              onPress={() => router.push(`/(main)/concept/${concept.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.conceptHeader}>
                <Text style={styles.conceptName}>{concept.name}</Text>
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
                <Text style={styles.conceptDescription}>{concept.description}</Text>
              )}

              <Text style={styles.conceptAction}>Study this concept →</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingBottom: 40,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  errorCard: {
    backgroundColor: '#2D1B1B',
    borderRadius: 12,
    padding: 20,
  },
  errorText: {
    color: '#E17055',
    fontSize: 14,
  },
  emptyText: {
    color: '#A0A0B8',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  conceptCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    gap: 8,
  },
  conceptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conceptName: {
    fontSize: 17,
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
  conceptDescription: {
    fontSize: 14,
    color: '#A0A0B8',
    lineHeight: 20,
  },
  conceptAction: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '500',
    marginTop: 4,
  },
});
