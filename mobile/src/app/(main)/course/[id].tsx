/**
 * Course detail screen.
 *
 * Shows the course with its modules. Tapping a module shows its topics.
 * Follows hierarchy: Course → Module → Topic → Concept
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
import { fetchCourse, fetchTopics } from '@/lib/api';

interface Module {
  id: string;
  title: string;
  description: string;
  sort_order: number;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  sort_order: number;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [topicsByModule, setTopicsByModule] = useState<Record<string, Topic[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      setError(null);
      const data = await fetchCourse(id!);
      setCourse(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleId: string) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null);
      return;
    }

    setExpandedModule(moduleId);

    // Load topics if not already loaded
    if (!topicsByModule[moduleId]) {
      setLoadingTopics(moduleId);
      try {
        const data = await fetchTopics(id!, moduleId);
        setTopicsByModule((prev) => ({ ...prev, [moduleId]: data.topics || [] }));
      } catch (err) {
        // silently fail — show empty
        setTopicsByModule((prev) => ({ ...prev, [moduleId]: [] }));
      } finally {
        setLoadingTopics(null);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Course not found'}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: course.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Course header */}
        <View style={styles.header}>
          <Text style={styles.title}>{course.title}</Text>
          {course.description && (
            <Text style={styles.description}>{course.description}</Text>
          )}
        </View>

        {/* Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modules</Text>

          {(course.modules || []).map((mod: Module, index: number) => (
            <View key={mod.id} style={styles.moduleContainer}>
              <TouchableOpacity
                style={[
                  styles.moduleCard,
                  expandedModule === mod.id && styles.moduleCardExpanded,
                ]}
                onPress={() => toggleModule(mod.id)}
                activeOpacity={0.7}
              >
                <View style={styles.moduleHeader}>
                  <View style={styles.moduleIndex}>
                    <Text style={styles.moduleIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleTitle}>{mod.title}</Text>
                    {mod.description && (
                      <Text style={styles.moduleDescription}>{mod.description}</Text>
                    )}
                  </View>
                  <Text style={styles.chevron}>
                    {expandedModule === mod.id ? '▼' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Expanded topics */}
              {expandedModule === mod.id && (
                <View style={styles.topicsContainer}>
                  {loadingTopics === mod.id ? (
                    <ActivityIndicator size="small" color="#6C5CE7" style={{ padding: 16 }} />
                  ) : (topicsByModule[mod.id] || []).length === 0 ? (
                    <Text style={styles.emptyTopics}>No topics yet</Text>
                  ) : (
                    topicsByModule[mod.id].map((topic) => (
                      <TouchableOpacity
                        key={topic.id}
                        style={styles.topicItem}
                        onPress={() => router.push(`/(main)/topic/${topic.id}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.topicTitle}>{topic.title}</Text>
                        <Text style={styles.topicArrow}>→</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
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
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#A0A0B8',
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  moduleContainer: {
    gap: 0,
  },
  moduleCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  moduleCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduleIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C5CE7' + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleIndexText: {
    color: '#6C5CE7',
    fontWeight: '700',
    fontSize: 14,
  },
  moduleInfo: {
    flex: 1,
    gap: 2,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moduleDescription: {
    fontSize: 13,
    color: '#A0A0B8',
  },
  chevron: {
    color: '#A0A0B8',
    fontSize: 12,
  },
  topicsContainer: {
    backgroundColor: '#161628',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#2A2A4A',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 4,
  },
  emptyTopics: {
    color: '#666',
    fontSize: 13,
    padding: 16,
    textAlign: 'center',
  },
  topicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A4A' + '44',
  },
  topicTitle: {
    fontSize: 15,
    color: '#DDDDF0',
    flex: 1,
  },
  topicArrow: {
    color: '#6C5CE7',
    fontSize: 16,
  },
});
