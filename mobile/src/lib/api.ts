/**
 * API client for communicating with the AlgoMentor backend.
 *
 * Automatically attaches the Supabase JWT to all requests.
 * Per DEC-PEN-03: Uses Supabase session tokens for authentication.
 */

import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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

