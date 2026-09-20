/**
 * Tutor Engine Service.
 *
 * Implements the core tutoring loop and session management based on:
 * - AI_TUTOR_ENGINE.md (§2 Core Loop, §4 Prerequisite Descent, §8 Hint Ladder)
 * - KNOWLEDGE_MODEL.md (§4 Student Knowledge State)
 * - ARCHITECTURE.md (§4 Backend Tutor Engine Module)
 */

import { getSupabase } from '../config/supabase';
import { getAIProvider, GeneratedQuestion, TutorContext, StudentResponse } from './ai';

const MASTERY_ORDER = ['UNKNOWN', 'INTRODUCED', 'LEARNING', 'DEVELOPING', 'PROFICIENT', 'MASTERED'] as const;
type MasteryState = typeof MASTERY_ORDER[number];

export class TutorEngine {
  private get supabase() {
    return getSupabase();
  }
  private get ai() {
    return getAIProvider();
  }

  /**
   * Start a new tutoring session or resume an active one for a concept.
   */
  async startOrResumeSession(userId: string, conceptId: string) {
    // 1. Fetch concept
    const { data: concept, error: conceptError } = await this.supabase
      .from('concepts')
      .select('id, name, description, difficulty, learning_objectives, topic_id')
      .eq('id', conceptId)
      .single();

    if (conceptError || !concept) {
      throw new Error(`Concept not found: ${conceptError?.message || conceptId}`);
    }

    // 2. Fetch or create student knowledge state
    let { data: knowledge } = await this.supabase
      .from('student_knowledge')
      .select('*')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .single();

    if (!knowledge) {
      const { data: newKnowledge, error: createKnowError } = await this.supabase
        .from('student_knowledge')
        .insert({
          user_id: userId,
          concept_id: conceptId,
          mastery_state: 'INTRODUCED',
          evidence_score: 0.1,
          last_assessed: new Date().toISOString(),
        })
        .select()
        .single();

      if (createKnowError) {
        console.error('[TutorEngine] Error creating student_knowledge:', createKnowError);
      }
      knowledge = newKnowledge || { mastery_state: 'INTRODUCED', evidence_score: 0.1 };
    }

    // 3. Check for an existing active session
    let { data: session } = await this.supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      const { data: newSession, error: sessionError } = await this.supabase
        .from('learning_sessions')
        .insert({
          user_id: userId,
          concept_id: conceptId,
          session_type: 'tutoring',
          status: 'active',
        })
        .select()
        .single();

      if (sessionError || !newSession) {
        throw new Error(`Failed to create learning session: ${sessionError?.message}`);
      }
      session = newSession;
    }

    // 4. Fetch all interactions in this session
    const { data: interactions } = await this.supabase
      .from('interactions')
      .select('*')
      .eq('session_id', session.id)
      .order('sort_order', { ascending: true });

    // Check if there is already an unanswered interaction
    const pendingInteraction = interactions?.find((i) => !i.student_response);
    if (pendingInteraction) {
      return {
        session,
        concept,
        currentInteraction: pendingInteraction,
        history: interactions?.filter((i) => !!i.student_response) || [],
        masteryState: knowledge.mastery_state,
      };
    }

    // 5. Generate first question if none exist
    const context: TutorContext = {
      conceptId: concept.id,
      conceptName: concept.name,
      conceptDescription: concept.description || '',
      learningObjectives: concept.learning_objectives || [],
      masteryState: knowledge.mastery_state,
      difficulty: concept.difficulty || 'beginner',
      recentInteractions: (interactions || []).map((i) => ({
        interactionType: i.interaction_type,
        question: i.question,
        studentResponse: i.student_response,
        evaluation: i.evaluation,
        hintLevel: i.hint_level || 0,
      })),
    };

    const question = await this.ai.generateQuestion(context);

    // Save interaction
    const { data: createdInteraction, error: intError } = await this.supabase
      .from('interactions')
      .insert({
        session_id: session.id,
        interaction_type: question.interactionType,
        question: question,
        expected_evidence: question.expectedEvidence,
        hint_level: 0,
        sort_order: (interactions?.length || 0) + 1,
      })
      .select()
      .single();

    if (intError || !createdInteraction) {
      throw new Error(`Failed to save interaction: ${intError?.message}`);
    }

    return {
      session,
      concept,
      currentInteraction: createdInteraction,
      history: interactions || [],
      masteryState: knowledge.mastery_state,
    };
  }

  /**
   * Submit a student's response to an interaction, evaluate it, and update knowledge state.
   */
  async submitResponse(
    userId: string,
    sessionId: string,
    interactionId: string,
    studentResponse: StudentResponse
  ) {
    // 1. Verify session
    const { data: session } = await this.supabase
      .from('learning_sessions')
      .select('*, concepts(*)')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) {
      throw new Error('Session not found or unauthorized');
    }

    // 2. Fetch interaction
    const { data: interaction } = await this.supabase
      .from('interactions')
      .select('*')
      .eq('id', interactionId)
      .eq('session_id', sessionId)
      .single();

    if (!interaction) {
      throw new Error('Interaction not found');
    }

    if (interaction.student_response) {
      return {
        alreadyAnswered: true,
        evaluation: interaction.evaluation,
      };
    }

    const concept = session.concepts;

    // 3. Fetch student knowledge
    const { data: knowledge } = await this.supabase
      .from('student_knowledge')
      .select('*')
      .eq('user_id', userId)
      .eq('concept_id', session.concept_id)
      .single();

    // 4. Build context and evaluate response with AI
    const { data: allInteractions } = await this.supabase
      .from('interactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true });

    const context: TutorContext = {
      conceptId: concept.id,
      conceptName: concept.name,
      conceptDescription: concept.description || '',
      learningObjectives: concept.learning_objectives || [],
      masteryState: knowledge?.mastery_state || 'LEARNING',
      difficulty: concept.difficulty,
      recentInteractions: (allInteractions || []).map((i) => ({
        interactionType: i.interaction_type,
        question: i.question,
        studentResponse: i.student_response,
        evaluation: i.evaluation,
        hintLevel: i.hint_level || 0,
      })),
    };

    const question: GeneratedQuestion = interaction.question;
    const evaluation = await this.ai.evaluateResponse(context, question, studentResponse);

    // 5. Update interaction row
    const responsePayload = {
      answer: studentResponse.answer,
      confidence: studentResponse.confidence,
      submitted_at: new Date().toISOString(),
    };

    await this.supabase
      .from('interactions')
      .update({
        student_response: responsePayload,
        evaluation: evaluation,
      })
      .eq('id', interactionId);

    // 6. Compute new mastery state & evidence score
    const currentScore = knowledge?.evidence_score || 0;
    const newScore = Math.min(1.0, Math.max(0.0, currentScore * 0.7 + evaluation.score * 0.3));
    const currentMastery = (knowledge?.mastery_state as MasteryState) || 'INTRODUCED';
    const nextMastery = this.computeNextMasteryState(currentMastery, evaluation.score, newScore);

    await this.supabase
      .from('student_knowledge')
      .update({
        mastery_state: nextMastery,
        evidence_score: newScore,
        last_assessed: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('concept_id', session.concept_id);

    // 7. Determine if session should conclude or generate next interaction
    const totalAnswered = (allInteractions?.filter((i) => i.id !== interactionId && i.student_response)?.length || 0) + 1;
    const isCompleted = totalAnswered >= 3 && (nextMastery === 'PROFICIENT' || nextMastery === 'MASTERED' || evaluation.score >= 0.8);

    let nextInteraction = null;

    if (isCompleted) {
      await this.supabase
        .from('learning_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } else {
      // Generate next question
      context.masteryState = nextMastery;
      context.recentInteractions.push({
        interactionType: interaction.interaction_type,
        question: question,
        studentResponse: responsePayload,
        evaluation: evaluation,
        hintLevel: interaction.hint_level || 0,
      });

      const nextQuestion = await this.ai.generateQuestion(context);

      const { data: createdNext } = await this.supabase
        .from('interactions')
        .insert({
          session_id: sessionId,
          interaction_type: nextQuestion.interactionType,
          question: nextQuestion,
          expected_evidence: nextQuestion.expectedEvidence,
          hint_level: 0,
          sort_order: totalAnswered + 1,
        })
        .select()
        .single();

      nextInteraction = createdNext;
    }

    return {
      evaluation,
      nextInteraction,
      masteryState: nextMastery,
      isCompleted,
    };
  }

  /**
   * Request a hint according to the hint ladder (Levels 1–7).
   */
  async requestHint(userId: string, sessionId: string, interactionId: string) {
    const { data: session } = await this.supabase
      .from('learning_sessions')
      .select('*, concepts(*)')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) {
      throw new Error('Session not found or unauthorized');
    }

    const { data: interaction } = await this.supabase
      .from('interactions')
      .select('*')
      .eq('id', interactionId)
      .eq('session_id', sessionId)
      .single();

    if (!interaction) {
      throw new Error('Interaction not found');
    }

    const currentHintLevel = interaction.hint_level || 0;
    const nextHintLevel = Math.min(currentHintLevel + 1, 7);

    const context: TutorContext = {
      conceptId: session.concepts.id,
      conceptName: session.concepts.name,
      conceptDescription: session.concepts.description || '',
      learningObjectives: session.concepts.learning_objectives || [],
      masteryState: 'LEARNING',
      recentInteractions: [],
    };

    const hint = await this.ai.generateHint(context, interaction.question, nextHintLevel);

    // Save escalated hint level
    await this.supabase
      .from('interactions')
      .update({ hint_level: nextHintLevel })
      .eq('id', interactionId);

    return hint;
  }

  /**
   * Get full session state and history.
   */
  async getSessionDetails(userId: string, sessionId: string) {
    const { data: session } = await this.supabase
      .from('learning_sessions')
      .select('*, concepts(*)')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    const { data: interactions } = await this.supabase
      .from('interactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true });

    const { data: knowledge } = await this.supabase
      .from('student_knowledge')
      .select('*')
      .eq('user_id', userId)
      .eq('concept_id', session.concept_id)
      .maybeSingle();

    return {
      session,
      concept: session.concepts,
      interactions: interactions || [],
      masteryState: knowledge?.mastery_state || 'UNKNOWN',
    };
  }

  /**
   * Mastery state transition function per KNOWLEDGE_MODEL.md §4.
   */
  private computeNextMasteryState(
    current: MasteryState,
    interactionScore: number,
    evidenceScore: number
  ): MasteryState {
    const currentIndex = MASTERY_ORDER.indexOf(current);

    if (interactionScore >= 0.8) {
      // Good performance: advance state if evidence is sufficient
      if (current === 'UNKNOWN') return 'INTRODUCED';
      if (current === 'INTRODUCED') return 'LEARNING';
      if (current === 'LEARNING' && evidenceScore >= 0.4) return 'DEVELOPING';
      if (current === 'DEVELOPING' && evidenceScore >= 0.7) return 'PROFICIENT';
      if (current === 'PROFICIENT' && evidenceScore >= 0.85) return 'MASTERED';
      return current;
    }

    if (interactionScore < 0.4 && currentIndex > 2) {
      // Significant struggle: regress to reinforce foundational understanding
      return MASTERY_ORDER[currentIndex - 1];
    }

    return current;
  }
}

export const tutorEngine = new TutorEngine();
