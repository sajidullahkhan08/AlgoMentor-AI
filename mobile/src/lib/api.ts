/**
 * API client for communicating with the AlgoMentor backend.
 *
 * Automatically attaches the Supabase JWT to all requests.
 * Per DEC-PEN-03: Uses Supabase session tokens for authentication.
 *
 * On physical devices (Expo Go), `localhost` points to the phone itself,
 * not the computer running the backend. We auto-detect the dev machine's
 * LAN IP from Expo's debuggerHost constant so it works on both platforms.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

function getApiBaseUrl(): string {
  // If the user explicitly set an API URL in .env, honor it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // On web, localhost works fine because the browser is on the same machine
  if (Platform.OS === 'web') {
    return envUrl || 'http://localhost:3000/api';
  }

  // On native (Expo Go on a physical device), extract the dev machine's IP
  // from the debuggerHost that Expo automatically sets
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? // SDK 57+
    (Constants as any).manifest?.debuggerHost ?? // older SDKs
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    // debuggerHost is "192.168.x.x:8081" — strip the Metro port and use backend port
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000/api`;
  }

  // Ultimate fallback — shouldn't happen if Expo Go is running
  return envUrl || 'http://localhost:3000/api';
}

const API_BASE_URL = getApiBaseUrl();

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    };
  }
  return { 'Content-Type': 'application/json' };
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// --- Curriculum API ---

export async function fetchCourses() {
  return apiRequest<{ courses: any[] }>('/courses');
}

export async function fetchCourse(id: string) {
  return apiRequest<any>(`/courses/${id}`);
}

export async function fetchTopics(courseId: string, moduleId: string) {
  return apiRequest<{ topics: any[] }>(`/courses/${courseId}/modules/${moduleId}/topics`);
}

export async function fetchConceptsByTopic(topicId: string) {
  return apiRequest<{ concepts: any[] }>(`/concepts/topic/${topicId}`);
}

export async function fetchConcept(id: string) {
  return apiRequest<any>(`/concepts/${id}`);
}

export async function fetchPrerequisites(conceptId: string) {
  return apiRequest<{ prerequisites: any[] }>(`/concepts/${conceptId}/prerequisites`);
}

// --- Profile API ---

export async function fetchProfile() {
  return apiRequest<any>('/profiles/me');
}

export async function updateProfile(data: {
  display_name?: string;
  experience_level?: string;
  preferred_language?: string;
}) {
  return apiRequest<any>('/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// --- Tutor Engine API ---

export interface TutorSessionResponse {
  session: {
    id: string;
    concept_id: string;
    status: 'active' | 'completed' | 'abandoned';
  };
  concept: {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    learning_objectives: string[];
  };
  currentInteraction: {
    id: string;
    interaction_type:
      | 'multiple_choice'
      | 'multiple_select'
      | 'ordering'
      | 'short_text'
      | 'prediction'
      | 'code_completion';
    question: {
      questionText: string;
      options?: string[];
      correctOptionIndex?: number;
      correctOptionIndices?: number[];
      orderingItems?: string[];
      correctOrder?: number[];
      objective?: string;
      isPrerequisiteDescent?: boolean;
      descentReason?: string;
      conceptId?: string;
      conceptName?: string;
    };
    hint_level: number;
    sort_order: number;
  };
  history: Array<{
    id: string;
    interaction_type: string;
    question: {
      questionText: string;
      options?: string[];
      orderingItems?: string[];
      isPrerequisiteDescent?: boolean;
      descentReason?: string;
      conceptName?: string;
    };
    student_response: { answer: string; confidence?: string };
    evaluation: {
      isCorrect: boolean;
      feedback: string;
      score: number;
      recommendation?: string;
      detectedMisconception?: string | null;
      calibration?: {
        type: 'overconfident' | 'underconfident' | 'calibrated';
        message: string;
      };
    };
  }>;
  masteryState: string;
}

export async function startTutorSession(conceptId: string): Promise<TutorSessionResponse> {
  return apiRequest<TutorSessionResponse>('/tutor/session', {
    method: 'POST',
    body: JSON.stringify({ conceptId }),
  });
}

export async function getTutorSession(sessionId: string): Promise<any> {
  return apiRequest<any>(`/tutor/session/${sessionId}`);
}

export async function submitTutorResponse(
  sessionId: string,
  interactionId: string,
  answer: string,
  confidence?: string
): Promise<{
  evaluation: {
    isCorrect: boolean;
    feedback: string;
    score: number;
    recommendation: string;
    detectedMisconception?: string | null;
    calibration?: {
      type: 'overconfident' | 'underconfident' | 'calibrated';
      message: string;
    };
  };
  nextInteraction: any;
  masteryState: string;
  isCompleted: boolean;
}> {
  return apiRequest<any>(`/tutor/session/${sessionId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ interactionId, answer, confidence }),
  });
}

export async function requestTutorHint(
  sessionId: string,
  interactionId: string
): Promise<{
  hintLevel: number;
  hintTitle: string;
  hintContent: string;
}> {
  return apiRequest<any>(`/tutor/session/${sessionId}/hint`, {
    method: 'POST',
    body: JSON.stringify({ interactionId }),
  });
}

// ---------------------------------------------------------------------------
// Phase 5: Problem Solving & DSA Patterns API
// ---------------------------------------------------------------------------

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  starter_code: {
    javascript: string;
    python?: string;
  };
  patterns?: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
  }>;
  concepts?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  attempts?: Array<{
    status: 'passed' | 'failed' | 'timeout' | 'error';
    runtime_ms?: number;
    created_at: string;
  }>;
}

export interface Pattern {
  id: string;
  name: string;
  slug: string;
  description: string;
  recognition_signals: string[];
  visual_mental_model?: string;
  key_invariants?: string[];
  time_complexity_optimal?: string;
  space_complexity_optimal?: string;
}

export interface CodeTestCaseResult {
  testIndex: number;
  input: any[];
  expectedOutput: any;
  actualOutput: any;
  passed: boolean;
  runtimeMs: number;
  error?: string;
}

export interface CodeRunResponse {
  results: CodeTestCaseResult[];
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  error?: string;
}

export interface CodeSubmitResponse {
  runResult: CodeRunResponse;
  review: {
    isOptimal: boolean;
    estimatedTimeComplexity: string;
    estimatedSpaceComplexity: string;
    feedback: string;
    socraticQuestions: string[];
    potentialEdgeCasesMissed: string[];
    suggestedImprovements: string[];
  };
  attemptId: string;
}

export interface ProblemHintResponse {
  hintLevel: number;
  category: string;
  title: string;
  hintContent: string;
}

export async function fetchProblems(filters?: {
  patternId?: string;
  difficulty?: string;
  search?: string;
}): Promise<{ problems: Problem[] }> {
  const queryParams = new URLSearchParams();
  if (filters?.patternId) queryParams.set('patternId', filters.patternId);
  if (filters?.difficulty) queryParams.set('difficulty', filters.difficulty);
  if (filters?.search) queryParams.set('search', filters.search);

  const queryString = queryParams.toString();
  return apiRequest<{ problems: Problem[] }>(
    `/problems${queryString ? `?${queryString}` : ''}`
  );
}

export async function fetchProblem(id: string): Promise<{ problem: Problem }> {
  return apiRequest<{ problem: Problem }>(`/problems/${id}`);
}

export async function fetchPatterns(): Promise<{ patterns: Pattern[] }> {
  return apiRequest<{ patterns: Pattern[] }>('/problems/patterns');
}

export async function runProblemCode(
  problemId: string,
  code: string,
  language: string = 'javascript'
): Promise<CodeRunResponse> {
  return apiRequest<CodeRunResponse>(`/problems/${problemId}/run`, {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
}

export async function submitProblemCode(
  problemId: string,
  code: string,
  language: string = 'javascript'
): Promise<CodeSubmitResponse> {
  return apiRequest<CodeSubmitResponse>(`/problems/${problemId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
}

export async function fetchProblemHint(
  problemId: string,
  hintLevel: number
): Promise<ProblemHintResponse> {
  return apiRequest<ProblemHintResponse>(`/problems/${problemId}/hint`, {
    method: 'POST',
    body: JSON.stringify({ hintLevel }),
  });
}

// ---------------------------------------------------------------------------
// Phase 7: Voice & Spoken Reasoning API
// ---------------------------------------------------------------------------

export interface SpokenReasoningReview {
  clarityScore: number;
  accuracyScore: number;
  conceptualGrasps: string[];
  missingPoints: string[];
  socraticFollowUp: string;
  feedback: string;
  interviewDeliveryTip: string;
}

export async function evaluateVoiceReasoning(
  prompt: string,
  transcript: string,
  topicOrProblem: string
): Promise<SpokenReasoningReview> {
  return apiRequest<SpokenReasoningReview>('/tutor/voice/evaluate', {
    method: 'POST',
    body: JSON.stringify({ prompt, transcript, topicOrProblem }),
  });
}

// ---------------------------------------------------------------------------
// Phase 8: Revision & Spaced Repetition API
// ---------------------------------------------------------------------------

export interface RevisionItem {
  id: string;
  item_type: 'concept' | 'problem' | 'invariant';
  title: string;
  prompt_question: string;
  solution_explanation: string;
  key_invariant: string;
  repetition_count: number;
  interval_days: number;
  easiness_factor: number;
  leitner_box: number;
  next_review_date: string;
  last_reviewed_at?: string | null;
  weakness_flags: string[];
}

export interface RevisionStats {
  totalItems: number;
  dueTodayCount: number;
  masteredCount: number;
  boxDistribution: { [box: number]: number };
  retentionRatePercent: number;
  currentStreakDays: number;
}

export interface RevisionReviewResult {
  item: RevisionItem;
  previousBox: number;
  newBox: number;
  intervalDays: number;
  nextReviewDate: string;
  earnedMastery: boolean;
  message: string;
}

export async function fetchRevisionQueue(): Promise<{
  dueItems: RevisionItem[];
  upcomingItems: RevisionItem[];
}> {
  return apiRequest<{ dueItems: RevisionItem[]; upcomingItems: RevisionItem[] }>('/revision/queue');
}

export async function submitRevisionReview(
  itemId: string,
  rating: number,
  confidence?: string,
  timeSpentSeconds?: number
): Promise<RevisionReviewResult> {
  return apiRequest<RevisionReviewResult>('/revision/review', {
    method: 'POST',
    body: JSON.stringify({ itemId, rating, confidence, timeSpentSeconds }),
  });
}

export async function fetchRevisionStats(): Promise<RevisionStats> {
  return apiRequest<RevisionStats>('/revision/stats');
}

// ---------------------------------------------------------------------------
// Phase 9: System Design API
// ---------------------------------------------------------------------------

export interface ArchitectureComponent {
  id: string;
  name: string;
  role: string;
}

export interface TradeOffQuestion {
  id: string;
  question: string;
  trade_off: string;
}

export interface SystemDesignScenario {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  scale_metrics: { [key: string]: string };
  functional_requirements: string[];
  non_functional_requirements: string[];
  architecture_components: ArchitectureComponent[];
  trade_off_questions: TradeOffQuestion[];
}

export interface SystemDesignEvaluation {
  score: number;
  isArchitecturallySound: boolean;
  strengths: string[];
  bottlenecksIdentified: string[];
  singlePointsOfFailure: string[];
  socraticChallenge: string;
  feedback: string;
  scalabilityVerdict: string;
}

export async function fetchSystemDesignScenarios(): Promise<SystemDesignScenario[]> {
  return apiRequest<SystemDesignScenario[]>('/system-design/scenarios');
}

export async function fetchSystemDesignScenario(
  idOrSlug: string
): Promise<SystemDesignScenario> {
  return apiRequest<SystemDesignScenario>(`/system-design/scenarios/${idOrSlug}`);
}

export async function submitSystemDesignEvaluation(
  scenarioId: string,
  selectedComponentIds: string[],
  userExplanation: string
): Promise<SystemDesignEvaluation> {
  return apiRequest<SystemDesignEvaluation>('/system-design/evaluate', {
    method: 'POST',
    body: JSON.stringify({ scenarioId, selectedComponentIds, userExplanation }),
  });
}




