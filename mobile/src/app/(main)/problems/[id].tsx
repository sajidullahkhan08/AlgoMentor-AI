import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  fetchProblem,
  runProblemCode,
  submitProblemCode,
  fetchProblemHint,
  Problem,
  CodeRunResponse,
  CodeSubmitResponse,
  ProblemHintResponse,
} from '../../../lib/api';
import { VisualArrayTrace } from '../../../components/VisualArrayTrace';

export default function ProblemWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'problem' | 'editor' | 'results' | 'review'>('problem');

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<CodeRunResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<CodeSubmitResponse | null>(null);

  // Hints state
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [hints, setHints] = useState<ProblemHintResponse[]>([]);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);

  const loadProblemData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetchProblem(id);
      setProblem(res.problem);
      setCode(res.problem.starter_code?.javascript || '');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProblemData();
  }, [loadProblemData]);

  const handleRunCode = async () => {
    if (!id) return;
    try {
      setIsRunning(true);
      const res = await runProblemCode(id, code, 'javascript');
      setRunResult(res);
      setActiveTab('results');
    } catch (err: any) {
      Alert.alert('Execution Error', err.message || 'Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await submitProblemCode(id, code, 'javascript');
      setSubmitResult(res);
      setRunResult(res.runResult);
      setActiveTab('review');
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestHint = async () => {
    if (!id) return;
    const nextLevel = hintLevel + 1;
    if (nextLevel > 5) {
      Alert.alert('Maximum Hints', 'You have unlocked all 5 graduated hints.');
      return;
    }

    try {
      setLoadingHint(true);
      const hintRes = await fetchProblemHint(id, nextLevel);
      setHints((prev) => [...prev, hintRes]);
      setHintLevel(nextLevel);
    } catch (err: any) {
      Alert.alert('Hint Error', err.message || 'Failed to generate hint');
    } finally {
      setLoadingHint(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading Problem Workspace...</Text>
      </View>
    );
  }

  if (!problem) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Problem not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Back to Catalog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Problems</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.problemTitle} numberOfLines={1}>
            {problem.title}
          </Text>
          <View style={styles.headerMeta}>
            <Text
              style={[
                styles.diffText,
                {
                  color:
                    problem.difficulty === 'easy'
                      ? '#34d399'
                      : problem.difficulty === 'medium'
                      ? '#fbbf24'
                      : '#f87171',
                },
              ]}
            >
              {problem.difficulty.toUpperCase()}
            </Text>
            {problem.patterns?.map((p) => (
              <Text key={p.id} style={styles.patternMetaText}>
                • {p.name}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navTabItem, activeTab === 'problem' && styles.navTabItemActive]}
          onPress={() => setActiveTab('problem')}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === 'problem' && styles.navTabTextActive,
            ]}
          >
            Description
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTabItem, activeTab === 'editor' && styles.navTabItemActive]}
          onPress={() => setActiveTab('editor')}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === 'editor' && styles.navTabTextActive,
            ]}
          >
            Code Editor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTabItem, activeTab === 'results' && styles.navTabItemActive]}
          onPress={() => setActiveTab('results')}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === 'results' && styles.navTabTextActive,
            ]}
          >
            Tests {runResult ? `(${runResult.passedCount}/${runResult.totalCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTabItem, activeTab === 'review' && styles.navTabItemActive]}
          onPress={() => setActiveTab('review')}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === 'review' && styles.navTabTextActive,
            ]}
          >
            Socratic Review
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'problem' && (
          <View style={styles.section}>
            {/* Problem Description */}
            <Text style={styles.sectionHeading}>Problem Statement</Text>
            <Text style={styles.descriptionBody}>{problem.description}</Text>

            {/* Invariant Visualizer */}
            <VisualArrayTrace
              initialArray={[-1, 0, 3, 5, 9, 12]}
              initialTarget={9}
              title="Interactive Algorithmic Invariant Trace"
            />

            {/* Examples */}
            <Text style={styles.sectionHeading}>Examples</Text>
            {problem.examples.map((ex, idx) => (
              <View key={idx} style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>Example {idx + 1}:</Text>
                <View style={styles.exampleField}>
                  <Text style={styles.exampleLabel}>Input:</Text>
                  <Text style={styles.exampleValue}>{ex.input}</Text>
                </View>
                <View style={styles.exampleField}>
                  <Text style={styles.exampleLabel}>Output:</Text>
                  <Text style={styles.exampleValue}>{ex.output}</Text>
                </View>
                {ex.explanation && (
                  <View style={styles.exampleField}>
                    <Text style={styles.exampleLabel}>Explanation:</Text>
                    <Text style={styles.exampleDesc}>{ex.explanation}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Constraints */}
            <Text style={styles.sectionHeading}>Constraints</Text>
            <View style={styles.constraintsCard}>
              {problem.constraints.map((c, idx) => (
                <Text key={idx} style={styles.constraintItem}>
                  • {c}
                </Text>
              ))}
            </View>

            {/* Quick action to switch to code editor */}
            <TouchableOpacity
              style={styles.openEditorButton}
              onPress={() => setActiveTab('editor')}
            >
              <Text style={styles.openEditorButtonText}>Open Code Editor & Solve ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'editor' && (
          <View style={styles.section}>
            <View style={styles.editorHeader}>
              <Text style={styles.editorLang}>JavaScript (Node.js)</Text>
              <TouchableOpacity
                onPress={() => setCode(problem.starter_code?.javascript || '')}
              >
                <Text style={styles.resetCodeBtn}>Reset to Starter Code</Text>
              </TouchableOpacity>
            </View>

            {/* Monospace Code Editor */}
            <TextInput
              style={styles.codeEditor}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              value={code}
              onChangeText={setCode}
            />

            {/* Run & Submit Bar */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btnRun, isRunning && styles.btnDisabled]}
                onPress={handleRunCode}
                disabled={isRunning || isSubmitting}
              >
                {isRunning ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnRunText}>▶ Run Test Cases</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSubmit, isSubmitting && styles.btnDisabled]}
                onPress={handleSubmitCode}
                disabled={isRunning || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnSubmitText}>🚀 Submit & Review</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Graduated Hints Section */}
            <View style={styles.hintSection}>
              <View style={styles.hintHeader}>
                <Text style={styles.hintTitle}>Socratic Hint Ladder ({hintLevel}/5)</Text>
                <TouchableOpacity
                  style={[styles.hintReqBtn, loadingHint && styles.btnDisabled]}
                  onPress={handleRequestHint}
                  disabled={loadingHint || hintLevel >= 5}
                >
                  {loadingHint ? (
                    <ActivityIndicator size="small" color="#38bdf8" />
                  ) : (
                    <Text style={styles.hintReqBtnText}>
                      {hintLevel === 0 ? 'Need a Hint?' : 'Next Hint Ladder Step'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {hints.map((h) => (
                <View key={h.hintLevel} style={styles.hintCard}>
                  <Text style={styles.hintCardTitle}>
                    Level {h.hintLevel}: {h.title} ({h.category})
                  </Text>
                  <Text style={styles.hintCardBody}>{h.hintContent}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'results' && (
          <View style={styles.section}>
            {runResult ? (
              <>
                <View
                  style={[
                    styles.resultSummaryBanner,
                    runResult.allPassed
                      ? styles.resultBannerSuccess
                      : styles.resultBannerFail,
                  ]}
                >
                  <Text style={styles.resultBannerTitle}>
                    {runResult.allPassed
                      ? '🎉 All Test Cases Passed!'
                      : `⚠️ ${runResult.passedCount} of ${runResult.totalCount} Test Cases Passed`}
                  </Text>
                  {runResult.error && (
                    <Text style={styles.resultBannerError}>{runResult.error}</Text>
                  )}
                </View>

                {/* Individual Test Cases */}
                {runResult.results.map((t) => (
                  <View key={t.testIndex} style={styles.testCaseCard}>
                    <View style={styles.testCaseHeader}>
                      <Text style={styles.testCaseTitle}>Test Case {t.testIndex + 1}</Text>
                      <View
                        style={[
                          styles.testBadge,
                          t.passed ? styles.testBadgePassed : styles.testBadgeFailed,
                        ]}
                      >
                        <Text style={styles.testBadgeText}>
                          {t.passed ? 'PASSED' : 'FAILED'} ({t.runtimeMs}ms)
                        </Text>
                      </View>
                    </View>

                    <View style={styles.testField}>
                      <Text style={styles.testLabel}>Input:</Text>
                      <Text style={styles.testCode}>{JSON.stringify(t.input)}</Text>
                    </View>

                    <View style={styles.testField}>
                      <Text style={styles.testLabel}>Expected Output:</Text>
                      <Text style={styles.testCode}>
                        {JSON.stringify(t.expectedOutput)}
                      </Text>
                    </View>

                    <View style={styles.testField}>
                      <Text style={styles.testLabel}>Actual Output:</Text>
                      <Text
                        style={[
                          styles.testCode,
                          !t.passed && styles.testCodeMismatch,
                        ]}
                      >
                        {JSON.stringify(t.actualOutput)}
                      </Text>
                    </View>

                    {t.error && (
                      <View style={styles.testField}>
                        <Text style={styles.testLabelError}>Runtime Error:</Text>
                        <Text style={styles.testErrorContent}>{t.error}</Text>
                      </View>
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.btnSubmitAfterRun}
                  onPress={handleSubmitCode}
                  disabled={isSubmitting}
                >
                  <Text style={styles.btnSubmitAfterRunText}>
                    {isSubmitting
                      ? 'Analyzing Solution...'
                      : 'Proceed to Socratic Code Review ➔'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyTests}>
                <Text style={styles.emptyTestsTitle}>No Test Runs Yet</Text>
                <Text style={styles.emptyTestsSubtitle}>
                  Click "Run Test Cases" in the code editor to evaluate your solution.
                </Text>
                <TouchableOpacity
                  style={styles.openEditorButton}
                  onPress={() => setActiveTab('editor')}
                >
                  <Text style={styles.openEditorButtonText}>Go to Code Editor</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'review' && (
          <View style={styles.section}>
            {submitResult ? (
              <>
                {/* Optimality Banner */}
                <View
                  style={[
                    styles.optimalityBanner,
                    submitResult.review.isOptimal
                      ? styles.optimalityBannerSuccess
                      : styles.optimalityBannerWarning,
                  ]}
                >
                  <Text style={styles.optimalityTitle}>
                    {submitResult.review.isOptimal
                      ? '✨ Optimal Solution Detected!'
                      : '💡 Sub-Optimal Complexity Detected'}
                  </Text>
                  <View style={styles.complexityTagsRow}>
                    <View style={styles.complexityTag}>
                      <Text style={styles.complexityTagLabel}>Time:</Text>
                      <Text style={styles.complexityTagVal}>
                        {submitResult.review.estimatedTimeComplexity}
                      </Text>
                    </View>
                    <View style={styles.complexityTag}>
                      <Text style={styles.complexityTagLabel}>Space:</Text>
                      <Text style={styles.complexityTagVal}>
                        {submitResult.review.estimatedSpaceComplexity}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Socratic Feedback Card */}
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewCardTitle}>Socratic Code Assessment</Text>
                  <Text style={styles.reviewFeedbackText}>
                    {submitResult.review.feedback}
                  </Text>
                </View>

                {/* Socratic Probing Questions */}
                {submitResult.review.socraticQuestions?.length > 0 && (
                  <View style={styles.socraticQuestionsCard}>
                    <Text style={styles.socraticQuestionsTitle}>
                      🤔 Socratic Invariant Reflections:
                    </Text>
                    {submitResult.review.socraticQuestions.map((q, idx) => (
                      <View key={idx} style={styles.questionItemRow}>
                        <Text style={styles.questionNum}>{idx + 1}.</Text>
                        <Text style={styles.questionText}>{q}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Edge Cases Missed */}
                {submitResult.review.potentialEdgeCasesMissed?.length > 0 && (
                  <View style={styles.edgeCasesCard}>
                    <Text style={styles.edgeCasesTitle}>
                      ⚠️ Critical Edge Cases to Verify:
                    </Text>
                    {submitResult.review.potentialEdgeCasesMissed.map((edge, idx) => (
                      <Text key={idx} style={styles.edgeCaseItem}>
                        • {edge}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Suggested Improvements */}
                {submitResult.review.suggestedImprovements?.length > 0 && (
                  <View style={styles.improvementsCard}>
                    <Text style={styles.improvementsTitle}>
                      🚀 Recommended Algorithmic Refinements:
                    </Text>
                    {submitResult.review.suggestedImprovements.map((imp, idx) => (
                      <Text key={idx} style={styles.improvementItem}>
                        • {imp}
                      </Text>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.openEditorButton}
                  onPress={() => setActiveTab('editor')}
                >
                  <Text style={styles.openEditorButtonText}>
                    Refine Code In Editor ➔
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyTests}>
                <Text style={styles.emptyTestsTitle}>No Review Available Yet</Text>
                <Text style={styles.emptyTestsSubtitle}>
                  Submit your code to receive AI Socratic Code Review and complexity analysis.
                </Text>
                <TouchableOpacity
                  style={styles.openEditorButton}
                  onPress={() => setActiveTab('editor')}
                >
                  <Text style={styles.openEditorButtonText}>Go to Code Editor</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  backButton: {
    paddingBottom: 6,
  },
  backButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  headerInfo: {
    gap: 4,
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '800',
  },
  patternMetaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  navTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabItemActive: {
    borderBottomColor: '#38bdf8',
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  navTabTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 60,
  },
  section: {
    gap: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 4,
  },
  descriptionBody: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  exampleCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
  exampleField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    width: 80,
  },
  exampleValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'monospace',
    flex: 1,
  },
  exampleDesc: {
    fontSize: 12,
    color: '#cbd5e1',
    flex: 1,
    lineHeight: 18,
  },
  constraintsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  constraintItem: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  openEditorButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginTop: 8,
  },
  openEditorButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editorLang: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  resetCodeBtn: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'underline',
  },
  codeEditor: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    color: '#f8fafc',
    fontFamily: 'monospace',
    fontSize: 13,
    minHeight: 280,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnRun: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnRunText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  btnSubmit: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  hintSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 14,
    gap: 10,
  },
  hintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  hintReqBtn: {
    backgroundColor: '#0c4a6e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hintReqBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  hintCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    gap: 4,
  },
  hintCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  hintCardBody: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  resultSummaryBanner: {
    padding: 14,
    borderRadius: 12,
    gap: 4,
  },
  resultBannerSuccess: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  resultBannerFail: {
    backgroundColor: '#451a03',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  resultBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  resultBannerError: {
    fontSize: 12,
    color: '#fca5a5',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  testCaseCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  testCaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testCaseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  testBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testBadgePassed: {
    backgroundColor: '#064e3b',
  },
  testBadgeFailed: {
    backgroundColor: '#7f1d1d',
  },
  testBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  testField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  testLabel: {
    fontSize: 11,
    color: '#64748b',
    width: 90,
  },
  testCode: {
    fontSize: 11,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    flex: 1,
  },
  testCodeMismatch: {
    color: '#f87171',
    fontWeight: '700',
  },
  testLabelError: {
    fontSize: 11,
    color: '#f87171',
    width: 90,
    fontWeight: '700',
  },
  testErrorContent: {
    fontSize: 11,
    color: '#fca5a5',
    fontFamily: 'monospace',
    flex: 1,
  },
  btnSubmitAfterRun: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSubmitAfterRunText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  optimalityBanner: {
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  optimalityBannerSuccess: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  optimalityBannerWarning: {
    backgroundColor: '#451a03',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  optimalityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  complexityTagsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  complexityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  complexityTagLabel: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  complexityTagVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  reviewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  reviewCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
  },
  reviewFeedbackText: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 21,
  },
  socraticQuestionsCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4338ca',
    gap: 8,
  },
  socraticQuestionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c7d2fe',
  },
  questionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  questionNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818cf8',
  },
  questionText: {
    fontSize: 12,
    color: '#e0e7ff',
    flex: 1,
    lineHeight: 18,
  },
  edgeCasesCard: {
    backgroundColor: '#1f1523',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#831843',
    gap: 6,
  },
  edgeCasesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbcfe8',
  },
  edgeCaseItem: {
    fontSize: 12,
    color: '#fce7f3',
    lineHeight: 18,
  },
  improvementsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  improvementsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
  improvementItem: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  emptyTests: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTestsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  emptyTestsSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0f1d',
    padding: 20,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
  errorText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
});
