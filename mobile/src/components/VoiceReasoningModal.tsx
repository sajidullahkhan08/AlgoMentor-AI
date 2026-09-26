import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { evaluateVoiceReasoning, SpokenReasoningReview } from '../lib/api';

interface VoiceReasoningModalProps {
  visible: boolean;
  onClose: () => void;
  promptText: string;
  topicOrProblem: string;
  sampleTranscript?: string;
  onSubmitted?: (review: SpokenReasoningReview, transcript: string) => void;
}

export function VoiceReasoningModal({
  visible,
  onClose,
  promptText,
  topicOrProblem,
  sampleTranscript = 'In binary search, we maintain two pointers, left and right. At every step, we check the middle element. Because the array is sorted, if the target is greater than mid, we can completely eliminate the left half. Halving the search space repeatedly gives us logarithmic time O(log n).',
  onSubmitted,
}: VoiceReasoningModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [reviewResult, setReviewResult] = useState<SpokenReasoningReview | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if in web browser
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recognition.onerror = (e: any) => {
          console.warn('[WebSpeech] Recognition error:', e);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsRecording(false);
    } else {
      // Start recording
      setReviewResult(null);
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('[WebSpeech] Start error:', err);
        }
      }
    }
  };

  const handleUseSample = () => {
    setTranscript(sampleTranscript);
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;

    try {
      setIsEvaluating(true);
      const result = await evaluateVoiceReasoning(promptText, transcript, topicOrProblem);
      setReviewResult(result);
      if (onSubmitted) {
        onSubmitted(result, transcript);
      }
    } catch (err: any) {
      console.error('[VoiceReasoning] Evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setTranscript('');
    setReviewResult(null);
    setIsRecording(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🎙️ Verbal Reasoning Studio</Text>
              <Text style={styles.subtitle}>{topicOrProblem}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
            {/* Prompt Card */}
            <View style={styles.promptCard}>
              <Text style={styles.promptLabel}>EXPLAIN OUT LOUD:</Text>
              <Text style={styles.promptText}>{promptText}</Text>
            </View>

            {/* Microphone Interaction Box */}
            <View style={styles.micSection}>
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                onPress={handleToggleRecording}
                activeOpacity={0.8}
              >
                <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
              </TouchableOpacity>
              <Text style={styles.micStatusText}>
                {isRecording
                  ? 'Listening... Speak your reasoning clearly.'
                  : transcript
                  ? 'Recording paused. Review or edit transcript below.'
                  : 'Tap microphone to start speaking.'}
              </Text>
            </View>

            {/* Editable Transcript Area */}
            <View style={styles.transcriptContainer}>
              <View style={styles.transcriptHeader}>
                <Text style={styles.transcriptLabel}>Spoken Transcript (Editable):</Text>
                <TouchableOpacity onPress={handleUseSample}>
                  <Text style={styles.sampleLink}>Use Sample Answer</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.transcriptInput}
                multiline
                placeholder="Speak into your microphone or type your spoken response here..."
                placeholderTextColor="#64748b"
                value={transcript}
                onChangeText={setTranscript}
              />
            </View>

            {/* Submit Bar */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnSecondary} onPress={handleReset}>
                <Text style={styles.btnSecondaryText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  (!transcript.trim() || isEvaluating) && styles.btnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!transcript.trim() || isEvaluating}
              >
                {isEvaluating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnPrimaryText}>🚀 Submit Verbal Reasoning</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Socratic Spoken Review Results */}
            {reviewResult && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewHeading}>🎯 Socratic Communication Assessment</Text>

                {/* Scores Row */}
                <View style={styles.scoresRow}>
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>Clarity</Text>
                    <Text style={[styles.scoreValue, { color: '#38bdf8' }]}>
                      {Math.round(reviewResult.clarityScore * 100)}%
                    </Text>
                  </View>
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>Accuracy</Text>
                    <Text style={[styles.scoreValue, { color: '#10b981' }]}>
                      {Math.round(reviewResult.accuracyScore * 100)}%
                    </Text>
                  </View>
                </View>

                {/* Socratic Feedback */}
                <View style={styles.feedbackCard}>
                  <Text style={styles.cardSectionTitle}>Feedback</Text>
                  <Text style={styles.feedbackText}>{reviewResult.feedback}</Text>
                </View>

                {/* Key Conceptual Points Grasped */}
                <View style={styles.pointsCard}>
                  <Text style={styles.pointsTitleGreen}>✨ Conceptual Key Points Grasped:</Text>
                  {reviewResult.conceptualGrasps.map((pt, idx) => (
                    <Text key={idx} style={styles.pointItem}>
                      • {pt}
                    </Text>
                  ))}
                </View>

                {/* Missing Points / Traps */}
                {reviewResult.missingPoints.length > 0 && (
                  <View style={styles.pointsCardAmber}>
                    <Text style={styles.pointsTitleAmber}>⚠️ Invariants or Edge Cases Overlooked:</Text>
                    {reviewResult.missingPoints.map((pt, idx) => (
                      <Text key={idx} style={styles.pointItem}>
                        • {pt}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Socratic Follow-Up */}
                <View style={styles.followUpCard}>
                  <Text style={styles.followUpTitle}>🤔 Socratic Follow-up Question:</Text>
                  <Text style={styles.followUpText}>{reviewResult.socraticFollowUp}</Text>
                </View>

                {/* Interview Delivery Tip */}
                <View style={styles.tipCard}>
                  <Text style={styles.tipTitle}>💼 Technical Interview Communication Tip:</Text>
                  <Text style={styles.tipText}>{reviewResult.interviewDeliveryTip}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0f1d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#38bdf8',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  bodyScroll: {
    maxHeight: 650,
  },
  bodyContent: {
    padding: 20,
    gap: 16,
  },
  promptCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    gap: 4,
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  promptText: {
    fontSize: 13,
    color: '#f1f5f9',
    fontWeight: '600',
    lineHeight: 19,
  },
  micSection: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  micButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  micIcon: {
    fontSize: 28,
  },
  micStatusText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  transcriptContainer: {
    gap: 6,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  sampleLink: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  transcriptInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  reviewSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 16,
    gap: 12,
  },
  reviewHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  feedbackCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  feedbackText: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 19,
  },
  pointsCard: {
    backgroundColor: '#064e3b20',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#10b98140',
    gap: 4,
  },
  pointsTitleGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  pointsCardAmber: {
    backgroundColor: '#451a0320',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b40',
    gap: 4,
  },
  pointsTitleAmber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  pointItem: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  followUpCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#818cf8',
    gap: 4,
  },
  followUpTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c7d2fe',
  },
  followUpText: {
    fontSize: 12,
    color: '#e0e7ff',
    lineHeight: 18,
  },
  tipCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  tipText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
});
