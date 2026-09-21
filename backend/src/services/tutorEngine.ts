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

    // 5. Fetch prerequisites for context
    const prerequisites = await this.getPrerequisites(concept.id);

    // 6. Generate first question if none exist
    const context: TutorContext = {
      conceptId: concept.id,
      conceptName: concept.name,
      conceptDescription: concept.description || '',
      learningObjectives: concept.learning_objectives || [],
      masteryState: knowledge.mastery_state,
      difficulty: concept.difficulty || 'beginner',
      prerequisites,
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

    const question: GeneratedQuestion = interaction.question;
    const isCurrentDescent = Boolean(question.isPrerequisiteDescent);

    const context: TutorContext = {
      conceptId: isCurrentDescent && question.conceptId ? question.conceptId : concept.id,
      conceptName: isCurrentDescent && question.conceptName ? question.conceptName : concept.name,
      conceptDescription: concept.description || '',
      learningObjectives: concept.learning_objectives || [],
      masteryState: knowledge?.mastery_state || 'LEARNING',
      difficulty: concept.difficulty,
      isPrerequisiteDescent: isCurrentDescent,
      descentReason: question.descentReason,
      recentInteractions: (allInteractions || []).map((i) => ({
        interactionType: i.interaction_type,
        question: i.question,
        studentResponse: i.student_response,
        evaluation: i.evaluation,
        hintLevel: i.hint_level || 0,
      })),
    };

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

    if (isCurrentDescent) {
      // Update prerequisite concept knowledge
      const prereqConceptId = question.conceptId;
      if (prereqConceptId && prereqConceptId !== session.concept_id) {
        const prereqMastery: MasteryState = evaluation.score >= 0.8 ? 'DEVELOPING' : 'LEARNING';
        await this.supabase.from('student_knowledge').upsert(
          {
            user_id: userId,
            concept_id: prereqConceptId,
            mastery_state: prereqMastery,
            evidence_score: evaluation.score >= 0.8 ? 0.75 : 0.4,
            last_assessed: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,concept_id' }
        );
      }
    } else {
      // Normal target concept update
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
    }

    // 7. Check if we should descend, ascend, complete, or advance
    const totalAnswered =
      (allInteractions?.filter((i) => i.id !== interactionId && i.student_response)?.length || 0) + 1;

    let nextInteraction = null;
    let isCompleted = false;

    // Prerequisite Descent Trigger Check:
    // If not already in descent and student struggled or AI recommended descent
    const shouldDescend =
      !isCurrentDescent &&
      (evaluation.recommendation === 'descend_prerequisite' ||
        (evaluation.score < 0.5 && (currentMastery === 'INTRODUCED' || currentMastery === 'LEARNING')));

    if (shouldDescend) {
      const unmasteredPrereq = await this.findUnmasteredPrerequisite(userId, session.concept_id);
      if (unmasteredPrereq) {
        evaluation.recommendation = 'descend_prerequisite';
        evaluation.recommendedPrerequisiteConceptId = unmasteredPrereq.id;

        const descentContext: TutorContext = {
          conceptId: unmasteredPrereq.id,
          conceptName: unmasteredPrereq.name,
          conceptDescription: unmasteredPrereq.description || '',
          learningObjectives: unmasteredPrereq.learning_objectives || [],
          masteryState: 'INTRODUCED',
          difficulty: unmasteredPrereq.difficulty || 'beginner',
          recentInteractions: [
            ...(allInteractions || []).map((i) => ({
              interactionType: i.interaction_type,
              question: i.question,
              studentResponse: i.id === interactionId ? responsePayload : i.student_response,
              evaluation: i.id === interactionId ? evaluation : i.evaluation,
              hintLevel: i.hint_level || 0,
            })),
          ],
          isPrerequisiteDescent: true,
          descentReason: `Reinforce foundational understanding of ${unmasteredPrereq.name} before continuing with ${concept.name}.`,
        };

        const prereqQuestion = await this.ai.generateQuestion(descentContext);
        prereqQuestion.isPrerequisiteDescent = true;
        prereqQuestion.descentReason = descentContext.descentReason;
        prereqQuestion.conceptId = unmasteredPrereq.id;
        prereqQuestion.conceptName = unmasteredPrereq.name;

        const { data: createdDescent } = await this.supabase
          .from('interactions')
          .insert({
            session_id: sessionId,
            interaction_type: prereqQuestion.interactionType,
            question: prereqQuestion,
            expected_evidence: prereqQuestion.expectedEvidence,
            hint_level: 0,
            sort_order: totalAnswered + 1,
          })
          .select()
          .single();

        nextInteraction = createdDescent;

        return {
          evaluation,
          nextInteraction,
          masteryState: nextMastery,
          isCompleted: false,
        };
      }
    }

    // Prerequisite Ascent Trigger Check:
    // If student just succeeded on a descent question (score >= 0.8), ascend back to the target concept!
    if (isCurrentDescent && evaluation.score >= 0.8) {
      evaluation.recommendation = 'ascend_target';
      evaluation.feedback += `\n\n🎉 Great job reinforcing this prerequisite! Now let's return to our target: ${concept.name}.`;

      const targetContext: TutorContext = {
        conceptId: concept.id,
        conceptName: concept.name,
        conceptDescription: concept.description || '',
        learningObjectives: concept.learning_objectives || [],
        masteryState: nextMastery,
        difficulty: concept.difficulty,
        recentInteractions: [
          ...(allInteractions || []).map((i) => ({
            interactionType: i.interaction_type,
            question: i.question,
            studentResponse: i.id === interactionId ? responsePayload : i.student_response,
            evaluation: i.id === interactionId ? evaluation : i.evaluation,
            hintLevel: i.hint_level || 0,
          })),
        ],
        isPrerequisiteDescent: false,
      };

      const nextQuestion = await this.ai.generateQuestion(targetContext);

      const { data: createdAscent } = await this.supabase
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

      nextInteraction = createdAscent;

      return {
        evaluation,
        nextInteraction,
        masteryState: nextMastery,
        isCompleted: false,
      };
    }

    // Check completion criteria for target concept
    isCompleted =
      !isCurrentDescent &&
      totalAnswered >= 3 &&
      (nextMastery === 'PROFICIENT' || nextMastery === 'MASTERED' || evaluation.score >= 0.8);

    if (isCompleted) {
      await this.supabase
        .from('learning_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } else {
      // Generate next question on target concept
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
   * Fetch all prerequisites for a given concept.
   */
  private async getPrerequisites(conceptId: string): Promise<Array<{ id: string; name: string }>> {
    const { data: rels } = await this.supabase
      .from('concept_relationships')
      .select('source_concept_id')
      .eq('target_concept_id', conceptId)
      .eq('relationship_type', 'prerequisite');

    if (!rels || rels.length === 0) return [];

    const ids = rels.map((r) => r.source_concept_id);
    const { data: prereqs } = await this.supabase
      .from('concepts')
      .select('id, name')
      .in('id', ids);

    return prereqs || [];
  }

  /**
   * Find the first unmastered prerequisite for a user and target concept.
   */
  private async findUnmasteredPrerequisite(userId: string, targetConceptId: string) {
    const { data: rels } = await this.supabase
      .from('concept_relationships')
      .select('source_concept_id')
      .eq('target_concept_id', targetConceptId)
      .eq('relationship_type', 'prerequisite');

    if (!rels || rels.length === 0) return null;

    const prereqIds = rels.map((r) => r.source_concept_id);

    // Fetch student's knowledge for all these prerequisites
    const { data: knowledgeRows } = await this.supabase
      .from('student_knowledge')
      .select('concept_id, mastery_state, evidence_score')
      .eq('user_id', userId)
      .in('concept_id', prereqIds);

    const knowledgeMap = new Map((knowledgeRows || []).map((k) => [k.concept_id, k]));

    // Find any prerequisite that is not PROFICIENT or MASTERED
    for (const prereqId of prereqIds) {
      const k = knowledgeMap.get(prereqId);
      const isMastered =
        k && (k.mastery_state === 'PROFICIENT' || k.mastery_state === 'MASTERED') && k.evidence_score >= 0.7;
      if (!isMastered) {
        const { data: prereqConcept } = await this.supabase
          .from('concepts')
          .select('id, name, description, difficulty, learning_objectives')
          .eq('id', prereqId)
          .single();
        if (prereqConcept) {
          return prereqConcept;
        }
      }
    }
    return null;
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
