/**
 * Socratic AI Tutor Session Screen.
 *
 * Implements the First Vertical Slice of the adaptive learning experience:
 * - Concept objective & mastery indicator
 * - Socratic conversation history (questions, student responses, feedback)
 * - Dynamic interaction renderer:
 *   - Multiple Choice (low-friction selectable cards)
 *   - Short text reasoning input
 * - Hint ladder escalation (Levels 1–7)
 * - Self-reported confidence selector
 * - Session completion review
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  getTutorSession,
  submitTutorResponse,
  requestTutorHint,
} from '@/lib/api';

interface Interaction {
  id: string;
  interaction_type: 'multiple_choice' | 'short_text' | 'prediction' | 'code_completion';
  question: {
    questionText: string;
    options?: string[];
    objective?: string;
  };
  student_response?: {
    answer: string;
    confidence?: string;
  };
  evaluation?: {
    isCorrect: boolean;
    feedback: string;
    score: number;
    detectedMisconception?: string | null;
  };
  hint_level?: number;
}

type ConfidenceLevel = 'confident' | 'somewhat_confident' | 'unsure' | 'dont_know';

export default function TutorSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  const [concept, setConcept] = useState<any>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [masteryState, setMasteryState] = useState<string>('LEARNING');
  const [isCompleted, setIsCompleted] = useState(false);

  // Active answer state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('confident');
  const [activeHint, setActiveHint] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await getTutorSession(id as string);
      setConcept(data.concept);
      setInteractions(data.interactions || []);
      setMasteryState(data.masteryState || 'LEARNING');
      setIsCompleted(data.session.status === 'completed');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const currentInteraction = interactions.find((i) => !i.student_response);

  const handleSubmit = async () => {
    if (!currentInteraction) return;

    let finalAnswer = '';
    if (currentInteraction.interaction_type === 'multiple_choice') {
      if (selectedOption === null) {
        Alert.alert('Selection required', 'Please pick an option to continue.');
        return;
      }
      finalAnswer = selectedOption.toString();
    } else {
      if (!textAnswer.trim()) {
        Alert.alert('Input required', 'Please share your thoughts or explanation.');
        return;
      }
      finalAnswer = textAnswer.trim();
    }

    try {
      setSubmitting(true);
      const result = await submitTutorResponse(
        id as string,
        currentInteraction.id,
        finalAnswer,
        confidence
      );

      // Update local interactions
      const updated = interactions.map((item) => {
        if (item.id === currentInteraction.id) {
          return {
            ...item,
            student_response: { answer: finalAnswer, confidence },
            evaluation: result.evaluation,
          };
        }
        return item;
      });

      if (result.nextInteraction) {
        updated.push(result.nextInteraction);
      }

      setInteractions(updated);
      setMasteryState(result.masteryState);
      setIsCompleted(result.isCompleted);

      // Reset active input
      setSelectedOption(null);
      setTextAnswer('');
      setActiveHint(null);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestHint = async () => {
    if (!currentInteraction) return;
    try {
      setHintLoading(true);
      const hint = await requestTutorHint(id as string, currentInteraction.id);
      setActiveHint({
        title: hint.hintTitle,
        content: hint.hintContent,
      });
    } catch (err: any) {
      Alert.alert('Hint Error', err.message || 'Unable to retrieve hint');
    } finally {
      setHintLoading(false);
    }
  };

  const getMasteryColor = (state: string) => {
    switch (state) {
      case 'MASTERED':
        return '#00B894';
      case 'PROFICIENT':
        return '#0984E3';
      case 'DEVELOPING':
        return '#FDCB6E';
      case 'LEARNING':
        return '#6C5CE7';
      default:
        return '#A0A0B8';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Connecting to AlgoMentor AI...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: concept?.name ? `Tutor: ${concept.name}` : 'AI Tutor Session',
          headerStyle: { backgroundColor: '#0F0F23' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.content}
        >
          {/* Header Banner */}
          <View style={styles.sessionHeader}>
            <View>
              <Text style={styles.conceptTitle}>{concept?.name}</Text>
              <Text style={styles.objectiveSubtitle}>
                {currentInteraction?.question.objective || 'Active Socratic Guidance'}
              </Text>
            </View>
            <View
              style={[
                styles.masteryPill,
                { backgroundColor: getMasteryColor(masteryState) + '22', borderColor: getMasteryColor(masteryState) },
              ]}
            >
              <Text style={[styles.masteryPillText, { color: getMasteryColor(masteryState) }]}>
                {masteryState}
              </Text>
            </View>
          </View>

          {/* Socratic History Flow */}
          {interactions.map((interaction, idx) => {
            const hasAnswered = !!interaction.student_response;
            const q = interaction.question;

            return (
              <View key={interaction.id || idx} style={styles.turnCard}>
                {/* Tutor Question */}
                <View style={styles.tutorBubble}>
                  <View style={styles.avatarRow}>
                    <Text style={styles.avatarIcon}>🧠</Text>
                    <Text style={styles.avatarName}>AlgoMentor Tutor</Text>
                  </View>
                  <Text style={styles.questionText}>{q.questionText}</Text>
                </View>

                {/* If already answered: show student response & evaluation */}
                {hasAnswered && (
                  <>
                    <View style={styles.studentBubble}>
                      <Text style={styles.studentLabel}>Your Reasoning</Text>
                      <Text style={styles.studentAnswerText}>
                        {interaction.interaction_type === 'multiple_choice' && q.options
                          ? q.options[parseInt(interaction.student_response!.answer, 10)] ||
                            interaction.student_response!.answer
                          : interaction.student_response!.answer}
                      </Text>
                    </View>

                    {interaction.evaluation && (
                      <View
                        style={[
                          styles.feedbackCard,
                          interaction.evaluation.isCorrect
                            ? styles.feedbackSuccess
                            : styles.feedbackWarning,
                        ]}
                      >
                        <Text style={styles.feedbackTitle}>
                          {interaction.evaluation.isCorrect ? '✅ Socratic Insight' : '💡 Key Nuance'}
                        </Text>
                        <Text style={styles.feedbackText}>
                          {interaction.evaluation.feedback}
                        </Text>
                        {interaction.evaluation.detectedMisconception && (
                          <Text style={styles.misconceptionText}>
                            Note: {interaction.evaluation.detectedMisconception}
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })}

          {/* Active Question Input Area (if not completed) */}
          {currentInteraction && !isCompleted && (
            <View style={styles.activeInteractionCard}>
              <Text style={styles.activeSectionTitle}>Your Turn</Text>

              {/* Multiple Choice Options */}
              {currentInteraction.interaction_type === 'multiple_choice' && (
                <View style={styles.optionsList}>
                  {currentInteraction.question.options?.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    return (
                      <TouchableOpacity
                        key={optIdx}
                        style={[
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                        ]}
                        onPress={() => setSelectedOption(optIdx)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Short Text Input */}
              {currentInteraction.interaction_type !== 'multiple_choice' && (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type your explanation or reasoning..."
                    placeholderTextColor="#666"
                    value={textAnswer}
                    onChangeText={setTextAnswer}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Confidence Selection */}
              <View style={styles.confidenceSection}>
                <Text style={styles.confidenceTitle}>How sure do you feel?</Text>
                <View style={styles.confidenceRow}>
                  {[
                    { key: 'confident', label: 'Confident' },
                    { key: 'somewhat_confident', label: 'Somewhat' },
                    { key: 'unsure', label: 'Unsure' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.confidenceChip,
                        confidence === item.key && styles.confidenceChipSelected,
                      ]}
                      onPress={() => setConfidence(item.key as ConfidenceLevel)}
                    >
                      <Text
                        style={[
                          styles.confidenceChipText,
                          confidence === item.key && styles.confidenceChipTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Active Hint Card (if requested) */}
              {activeHint && (
                <View style={styles.hintCard}>
                  <Text style={styles.hintCardTitle}>💡 {activeHint.title}</Text>
                  <Text style={styles.hintCardContent}>{activeHint.content}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.hintButton}
                  onPress={handleRequestHint}
                  disabled={hintLoading || submitting}
                >
                  {hintLoading ? (
                    <ActivityIndicator size="small" color="#FDCB6E" />
                  ) : (
                    <Text style={styles.hintButtonText}>
                      💡 {activeHint ? 'Next Hint' : 'Need a Hint?'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Reasoning →</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Session Complete Card */}
          {isCompleted && (
            <View style={styles.completeCard}>
              <Text style={styles.completeIcon}>🎉</Text>
              <Text style={styles.completeTitle}>Session Completed!</Text>
              <Text style={styles.completeMessage}>
                You have demonstrated genuine conceptual understanding of {concept?.name}.
              </Text>
              <View
                style={[
                  styles.masteryPill,
                  {
                    backgroundColor: getMasteryColor(masteryState) + '22',
                    borderColor: getMasteryColor(masteryState),
                    alignSelf: 'center',
                    marginTop: 12,
                  },
                ]}
              >
                <Text style={[styles.masteryPillText, { color: getMasteryColor(masteryState) }]}>
                  Current Mastery: {masteryState}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.returnButton}
                onPress={() => router.replace('/(main)/dashboard')}
              >
                <Text style={styles.returnButtonText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
    gap: 16,
  },
  loadingText: {
    color: '#A0A0B8',
    fontSize: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#16162C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  conceptTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  objectiveSubtitle: {
    color: '#A0A0B8',
    fontSize: 13,
    marginTop: 2,
  },
  masteryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  masteryPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  turnCard: {
    gap: 12,
  },
  tutorBubble: {
    backgroundColor: '#1E1E38',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    borderTopLeftRadius: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatarIcon: {
    fontSize: 18,
  },
  avatarName: {
    color: '#6C5CE7',
    fontSize: 13,
    fontWeight: '600',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  studentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2D2254',
    borderRadius: 16,
    padding: 14,
    maxWidth: '88%',
    borderBottomRightRadius: 4,
  },
  studentLabel: {
    color: '#A29BFE',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  studentAnswerText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  feedbackCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  feedbackSuccess: {
    backgroundColor: '#00B89415',
    borderColor: '#00B89444',
  },
  feedbackWarning: {
    backgroundColor: '#FDCB6E15',
    borderColor: '#FDCB6E44',
  },
  feedbackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackText: {
    color: '#DCDDE1',
    fontSize: 14,
    lineHeight: 20,
  },
  misconceptionText: {
    color: '#FAB1A0',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  activeInteractionCard: {
    backgroundColor: '#16162C',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D3D6B',
    gap: 16,
    marginTop: 8,
  },
  activeSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E38',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    gap: 12,
  },
  optionCardSelected: {
    borderColor: '#6C5CE7',
    backgroundColor: '#27234D',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#6C5CE7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6C5CE7',
  },
  optionText: {
    flex: 1,
    color: '#DCDDE1',
    fontSize: 15,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputWrapper: {
    backgroundColor: '#1E1E38',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    padding: 12,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 80,
  },
  confidenceSection: {
    gap: 8,
  },
  confidenceTitle: {
    color: '#A0A0B8',
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confidenceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E1E38',
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  confidenceChipSelected: {
    borderColor: '#6C5CE7',
    backgroundColor: '#27234D',
  },
  confidenceChipText: {
    color: '#A0A0B8',
    fontSize: 12,
  },
  confidenceChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hintCard: {
    backgroundColor: '#FDCB6E15',
    borderColor: '#FDCB6E44',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  hintCardTitle: {
    color: '#FDCB6E',
    fontSize: 13,
    fontWeight: '700',
  },
  hintCardContent: {
    color: '#F1F2F6',
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  hintButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDCB6E55',
    backgroundColor: '#FDCB6E15',
  },
  hintButtonText: {
    color: '#FDCB6E',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  completeCard: {
    backgroundColor: '#16162C',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00B89455',
    gap: 12,
    marginTop: 16,
  },
  completeIcon: {
    fontSize: 48,
  },
  completeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  completeMessage: {
    color: '#DCDDE1',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  returnButton: {
    backgroundColor: '#00B894',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
