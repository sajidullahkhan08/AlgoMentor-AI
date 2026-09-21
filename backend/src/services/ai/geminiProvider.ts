/**
 * Google Gemini AI Provider implementation for Phase 4 Adaptive Tutoring.
 *
 * Uses the official @google/genai SDK with gemini-2.5-flash.
 * Enforces structured output via responseMimeType and responseSchema.
 */

import { GoogleGenAI, Type } from '@google/genai';
import {
  AIProvider,
  TutorContext,
  GeneratedQuestion,
  StudentResponse,
  EvaluationResult,
  GeneratedHint,
} from './aiProvider';

const SYSTEM_INSTRUCTION = `You are an expert, adaptive Socratic computer science tutor in AlgoMentor AI.
Your teaching philosophy:
1. Active learning: Guide the student with questions rather than lecturing or immediately giving answers.
2. Evidence of understanding: Verify whether the student truly grasps the "why" and underlying mechanisms, not just memorized facts.
3. Tone: Patient, precise, encouraging, academically rigorous, never condescending.
4. Mobile-first responses: Formulate questions that are punchy and clear.
5. Adaptive Interaction Selection:
   - Use 'multiple_choice' for rapid mental model checks.
   - Use 'multiple_select' when identifying necessary preconditions or properties.
   - Use 'ordering' when tracing step-by-step algorithmic execution.
   - Use 'short_text' when probing deeper for "why" reasoning.
6. Prerequisite Descent:
   - If the student repeatedly struggles, diagnose whether a foundational prerequisite is missing and recommend 'descend_prerequisite'.`;

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateQuestion(context: TutorContext): Promise<GeneratedQuestion> {
    const prompt = `Concept: ${context.conceptName}
Description: ${context.conceptDescription}
Learning Objectives: ${context.learningObjectives.join(', ')}
Current Student Mastery: ${context.masteryState}
Is Prerequisite Descent: ${context.isPrerequisiteDescent ? 'YES (' + context.descentReason + ')' : 'NO'}
Past interactions in this session: ${JSON.stringify(context.recentInteractions.slice(-3))}

Generate the next Socratic question or challenge.
Choose the most effective interaction type:
- 'multiple_choice': for standard concept checks.
- 'multiple_select': for selecting all true statements or prerequisites.
- 'ordering': for putting algorithmic steps in order.
- 'short_text': for asking the student to explain why.`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interactionType: {
              type: Type.STRING,
              enum: ['multiple_choice', 'multiple_select', 'ordering', 'short_text', 'prediction', 'code_completion'],
            },
            questionText: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of choices if interactionType is multiple_choice or multiple_select',
            },
            correctOptionIndex: {
              type: Type.INTEGER,
              description: 'Zero-based index of the single correct choice if multiple_choice',
            },
            correctOptionIndices: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: 'Zero-based indices of all correct choices if multiple_select',
            },
            orderingItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of items to be arranged in order if interactionType is ordering',
            },
            correctOrder: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: 'Correct zero-based index sequence of orderingItems',
            },
            expectedEvidence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            objective: { type: Type.STRING },
          },
          required: ['interactionType', 'questionText', 'expectedEvidence', 'objective'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text) as GeneratedQuestion;
    parsed.conceptId = context.conceptId;
    parsed.conceptName = context.conceptName;
    parsed.isPrerequisiteDescent = context.isPrerequisiteDescent;
    parsed.descentReason = context.descentReason;
    return parsed;
  }

  async evaluateResponse(
    context: TutorContext,
    question: GeneratedQuestion,
    response: StudentResponse
  ): Promise<EvaluationResult> {
    const prompt = `Concept: ${context.conceptName}
Question: ${question.questionText}
Question Type: ${question.interactionType}
Options (if any): ${JSON.stringify(question.options || [])}
Correct Option Index: ${question.correctOptionIndex}
Correct Option Indices (if multi-select): ${JSON.stringify(question.correctOptionIndices || [])}
Ordering Items (if ordering): ${JSON.stringify(question.orderingItems || [])}
Correct Order (if ordering): ${JSON.stringify(question.correctOrder || [])}
Expected Evidence: ${question.expectedEvidence.join(', ')}

Student's Answer: "${response.answer}"
Student's Self-Reported Confidence: "${response.confidence || 'unspecified'}"

Evaluate the student's answer:
1. Determine correctness and compute a score (0.0 to 1.0).
2. Assess understanding demonstrated.
3. Provide Socratic feedback highlighting insights or misconceptions without bluntly spoiling future challenges.
4. Perform confidence calibration:
   - 'overconfident': if student reported 'confident' but made a key conceptual mistake.
   - 'underconfident': if student reported 'unsure' but their reasoning was correct.
   - 'calibrated': if confidence matches accuracy.
5. Recommendation:
   - 'advance': if understood.
   - 'probe_deeper': if partially understood.
   - 'descend_prerequisite': if fundamentally lacking prerequisite intuition.`;

    const res = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            understandingDemonstrated: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
            feedback: { type: Type.STRING, description: 'Socratic feedback message' },
            detectedMisconception: { type: Type.STRING, nullable: true },
            calibration: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['overconfident', 'underconfident', 'calibrated'] },
                message: { type: Type.STRING },
              },
              required: ['type', 'message'],
            },
            recommendation: {
              type: Type.STRING,
              enum: ['advance', 'probe_deeper', 'descend_prerequisite', 'ascend_target', 'retry'],
            },
          },
          required: ['isCorrect', 'understandingDemonstrated', 'score', 'feedback', 'recommendation'],
        },
      },
    });

    const text = res.text || '{}';
    return JSON.parse(text) as EvaluationResult;
  }

  async generateHint(
    context: TutorContext,
    question: GeneratedQuestion,
    hintLevel: number
  ): Promise<GeneratedHint> {
    const level = Math.min(Math.max(hintLevel, 1), 7);
    const hintLadderDescriptions: Record<number, string> = {
      1: 'Level 1: Socratic Question (prompt the student to consider a key aspect)',
      2: 'Level 2: Conceptual Clue (remind them of an underlying concept or invariant)',
      3: 'Level 3: Pattern Clue (relate it to a known DSA pattern)',
      4: 'Level 4: Algorithmic Clue (hint at the specific sequence of operations)',
      5: 'Level 5: Pseudocode (outline the structure in pseudocode)',
      6: 'Level 6: Implementation Guidance (concrete syntax or pointer logic)',
      7: 'Level 7: Full Walkthrough (complete explanation)',
    };

    const targetDescription = hintLadderDescriptions[level];

    const prompt = `Concept: ${context.conceptName}
Question: ${question.questionText}
Hint Level: ${level} (${targetDescription})

Generate a hint strictly matching this hint level. Do not skip levels or reveal more than this level allows.`;

    const res = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hintLevel: { type: Type.INTEGER },
            hintTitle: { type: Type.STRING },
            hintContent: { type: Type.STRING },
          },
          required: ['hintLevel', 'hintTitle', 'hintContent'],
        },
      },
    });

    const text = res.text || '{}';
    return JSON.parse(text) as GeneratedHint;
  }
}
