/**
 * Interactive System Design Studio Screen (Phase 9).
 *
 * Implements:
 * - Tab 1: Scale & Requirements (Back-of-the-envelope estimation)
 * - Tab 2: Architecture & Topology Builder (Component checklist, rationale, Socratic AI review)
 * - Tab 3: Trade-Off Analysis (Socratic deep-dives on architectural decisions)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  fetchSystemDesignScenario,
  submitSystemDesignEvaluation,
  SystemDesignScenario,
  SystemDesignEvaluation,
} from '../../../lib/api';

export default function SystemDesignStudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [scenario, setScenario] = useState<SystemDesignScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requirements' | 'architecture' | 'tradeoffs'>('requirements');

  // Architecture builder state
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [userExplanation, setUserExplanation] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<SystemDesignEvaluation | null>(null);

  // Trade-off revealed state
  const [revealedTradeOffs, setRevealedTradeOffs] = useState<{ [qId: string]: boolean }>({});

  const loadScenarioData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchSystemDesignScenario(id as string);
      setScenario(data);
      // Pre-select first 2 components to reduce empty state friction
      if (data?.architecture_components && data.architecture_components.length >= 2) {
        setSelectedComponents([data.architecture_components[0].id, data.architecture_components[1].id]);
      }
    } catch (err: any) {
      console.error('[SystemDesignStudio] Error loading scenario:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadScenarioData();
  }, [loadScenarioData]);

  const toggleComponent = (compId: string) => {
    setSelectedComponents((prev) =>
      prev.includes(compId) ? prev.filter((c) => c !== compId) : [...prev, compId]
    );
  };

  const handleEvaluate = async () => {
    if (!scenario || selectedComponents.length === 0) return;
    try {
      setEvaluating(true);
      const result = await submitSystemDesignEvaluation(
        scenario.id,
        selectedComponents,
        userExplanation || 'Using decoupled application servers, load balancing, caching and sharded storage.'
      );
      setEvaluation(result);
    } catch (err: any) {
      console.error('[SystemDesignStudio] Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const toggleTradeOffReveal = (qId: string) => {
    setRevealedTradeOffs((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  if (loading || !scenario) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading architecture scenario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← All Scenarios</Text>
        </TouchableOpacity>
        <Text style={styles.scenarioHeaderTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioCategoryText}>{scenario.category}</Text>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'requirements' && styles.tabItemActive]}
          onPress={() => setActiveTab('requirements')}
        >
          <Text style={[styles.tabText, activeTab === 'requirements' && styles.tabTextActive]}>
            1. Scale & Req
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'architecture' && styles.tabItemActive]}
          onPress={() => setActiveTab('architecture')}
        >
          <Text style={[styles.tabText, activeTab === 'architecture' && styles.tabTextActive]}>
            2. Architecture
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tradeoffs' && styles.tabItemActive]}
          onPress={() => setActiveTab('tradeoffs')}
        >
          <Text style={[styles.tabText, activeTab === 'tradeoffs' && styles.tabTextActive]}>
            3. Trade-Offs ({scenario.trade_off_questions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
        {/* TAB 1: REQUIREMENTS & SCALE */}
        {activeTab === 'requirements' && (
          <View style={styles.section}>
            {/* Scale Estimation Cards */}
            <Text style={styles.sectionHeading}>Back-of-the-Envelope Scale Calculations</Text>
            <View style={styles.metricsGrid}>
              {Object.entries(scenario.scale_metrics).map(([key, val], idx) => (
                <View key={idx} style={styles.metricCard}>
                  <Text style={styles.metricKey}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                  <Text style={styles.metricValue}>{val}</Text>
                </View>
              ))}
            </View>

            {/* Functional Requirements */}
            <Text style={styles.sectionHeading}>Functional Requirements</Text>
            <View style={styles.listCard}>
              {scenario.functional_requirements.map((req, idx) => (
                <View key={idx} style={styles.requirementRow}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>

            {/* Non-Functional Requirements */}
            <Text style={styles.sectionHeading}>Non-Functional Requirements</Text>
            <View style={styles.listCard}>
              {scenario.non_functional_requirements.map((req, idx) => (
                <View key={idx} style={styles.requirementRow}>
                  <Text style={[styles.checkIcon, { color: '#f59e0b' }]}>⚡</Text>
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.nextTabBtn}
              onPress={() => setActiveTab('architecture')}
              activeOpacity={0.8}
            >
              <Text style={styles.nextTabBtnText}>Proceed to Architecture Builder ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 2: ARCHITECTURE BUILDER */}
        {activeTab === 'architecture' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Select Proposed Architectural Tiers</Text>
            <Text style={styles.sectionSubtext}>
              Assemble the necessary components to satisfy throughput, storage, and availability.
            </Text>

            {scenario.architecture_components.map((comp) => {
              const isSelected = selectedComponents.includes(comp.id);
              return (
                <TouchableOpacity
                  key={comp.id}
                  style={[styles.componentCard, isSelected && styles.componentCardSelected]}
                  onPress={() => toggleComponent(comp.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.componentName, isSelected && styles.componentNameSelected]}>
                      {comp.name}
                    </Text>
                    <Text style={styles.componentRole}>{comp.role}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Architectural Rationale Input */}
            <Text style={[styles.sectionHeading, { marginTop: 14 }]}>
              Design Rationale & Data Flow (Optional)
            </Text>
            <TextInput
              style={styles.rationaleInput}
              placeholder="Explain how caching, database partitioning, and load balancing interact in your design..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={userExplanation}
              onChangeText={setUserExplanation}
            />

            {/* Evaluate Button */}
            <TouchableOpacity
              style={[styles.evaluateBtn, evaluating && { opacity: 0.7 }]}
              onPress={handleEvaluate}
              disabled={evaluating || selectedComponents.length === 0}
              activeOpacity={0.8}
            >
              {evaluating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.evaluateBtnText}>Submit for Socratic AI Review 🏛️</Text>
              )}
            </TouchableOpacity>

            {/* Socratic Evaluation Results */}
            {evaluation && (
              <View style={styles.evaluationContainer}>
                {/* Score Banner */}
                <View
                  style={[
                    styles.evalScoreBanner,
                    evaluation.isArchitecturallySound
                      ? styles.evalScoreSuccess
                      : styles.evalScoreWarning,
                  ]}
                >
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreNumber}>{evaluation.score}/100</Text>
                    <Text style={styles.scoreVerdict}>{evaluation.scalabilityVerdict}</Text>
                  </View>
                  <Text style={styles.evalFeedbackText}>{evaluation.feedback}</Text>
                </View>

                {/* Socratic Challenge */}
                <View style={styles.socraticChallengeBox}>
                  <Text style={styles.challengeIcon}>🤔</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeTitle}>Socratic Failure Mode Challenge:</Text>
                    <Text style={styles.challengeText}>{evaluation.socraticChallenge}</Text>
                  </View>
                </View>

                {/* Strengths */}
                {evaluation.strengths.length > 0 && (
                  <View style={styles.evalCard}>
                    <Text style={styles.evalCardTitle}>✨ Key Architectural Strengths</Text>
                    {evaluation.strengths.map((s, idx) => (
                      <Text key={idx} style={styles.evalPoint}>• {s}</Text>
                    ))}
                  </View>
                )}

                {/* Bottlenecks & SPOFs */}
                {(evaluation.bottlenecksIdentified.length > 0 || evaluation.singlePointsOfFailure.length > 0) && (
                  <View style={[styles.evalCard, { borderColor: '#f59e0b' }]}>
                    <Text style={[styles.evalCardTitle, { color: '#fbbf24' }]}>
                      ⚠️ Identified Bottlenecks & Failure Modes
                    </Text>
                    {evaluation.bottlenecksIdentified.map((b, idx) => (
                      <Text key={idx} style={styles.evalPoint}>• {b}</Text>
                    ))}
                    {evaluation.singlePointsOfFailure.map((s, idx) => (
                      <Text key={idx} style={[styles.evalPoint, { color: '#f87171' }]}>
                        • SPOF: {s}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: TRADEOFFS */}
        {activeTab === 'tradeoffs' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Critical Engineering Trade-Offs</Text>
            <Text style={styles.sectionSubtext}>
              Every system design choice involves sacrificing one property to optimize another.
            </Text>

            {scenario.trade_off_questions.map((q, idx) => {
              const isRevealed = !!revealedTradeOffs[q.id];
              return (
                <View key={q.id || idx} style={styles.tradeOffCard}>
                  <Text style={styles.tradeOffQuestion}>
                    {idx + 1}. {q.question}
                  </Text>
                  <TouchableOpacity
                    style={styles.revealTradeOffBtn}
                    onPress={() => toggleTradeOffReveal(q.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.revealTradeOffBtnText}>
                      {isRevealed ? 'Hide Analysis ▲' : 'Reveal Trade-Off Analysis ▼'}
                    </Text>
                  </TouchableOpacity>

                  {isRevealed && (
                    <View style={styles.tradeOffAnswerBox}>
                      <Text style={styles.tradeOffAnalysisText}>{q.trade_off}</Text>
                    </View>
                  )}
                </View>
              );
            })}
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
    fontSize: 14,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#082f49',
    borderBottomWidth: 1,
    borderBottomColor: '#0284c7',
  },
  backBtn: {
    paddingBottom: 6,
  },
  backBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  scenarioHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  scenarioCategoryText: {
    fontSize: 12,
    color: '#bae6fd',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#38bdf8',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
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
    gap: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: -8,
    lineHeight: 17,
  },
  metricsGrid: {
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  metricKey: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkIcon: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 14,
  },
  requirementText: {
    flex: 1,
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
  },
  nextTabBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  nextTabBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  componentCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  componentCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#082f49',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  checkMark: {
    color: '#082f49',
    fontSize: 12,
    fontWeight: '900',
  },
  componentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  componentNameSelected: {
    color: '#38bdf8',
  },
  componentRole: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  rationaleInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
  },
  evaluateBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  evaluateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  evaluationContainer: {
    marginTop: 12,
    gap: 12,
  },
  evalScoreBanner: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  evalScoreSuccess: {
    backgroundColor: '#06281e',
    borderColor: '#10b981',
  },
  evalScoreWarning: {
    backgroundColor: '#2e1906',
    borderColor: '#f59e0b',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f8fafc',
  },
  scoreVerdict: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    maxWidth: 220,
    textAlign: 'right',
  },
  evalFeedbackText: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 19,
  },
  socraticChallengeBox: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    flexDirection: 'row',
    gap: 10,
  },
  challengeIcon: {
    fontSize: 22,
  },
  challengeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a5b4fc',
    textTransform: 'uppercase',
  },
  challengeText: {
    fontSize: 13,
    color: '#f8fafc',
    marginTop: 2,
    lineHeight: 19,
  },
  evalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  evalCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 4,
  },
  evalPoint: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  tradeOffCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  tradeOffQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    lineHeight: 21,
  },
  revealTradeOffBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  revealTradeOffBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  tradeOffAnswerBox: {
    backgroundColor: '#082f49',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  tradeOffAnalysisText: {
    fontSize: 13,
    color: '#e0f2fe',
    lineHeight: 20,
  },
});
