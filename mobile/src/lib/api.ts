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
    interaction_type: 'multiple_choice' | 'short_text' | 'prediction' | 'code_completion';
    question: {
      questionText: string;
      options?: string[];
      objective?: string;
    };
    hint_level: number;
    sort_order: number;
  };
  history: Array<{
    id: string;
    interaction_type: string;
    question: { questionText: string };
    student_response: { answer: string };
    evaluation: { isCorrect: boolean; feedback: string };
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
