/**
 * Google Gemini AI Provider implementation.
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
4. Mobile-first responses: Formulate questions that are punchy and clear. Multiple choice options should be crisp and plausible.`;

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
Past interactions in this session: ${JSON.stringify(context.recentInteractions.slice(-3))}

Generate the next Socratic question or challenge.
If this is the start of the session, start with an intuitive conceptual check or low-friction multiple choice question to assess their mental model.
If the student previously struggled, ask a simpler question isolating the missing prerequisite.`;

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
              enum: ['multiple_choice', 'short_text', 'prediction', 'code_completion'],
            },
            questionText: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 4 distinct choices if interactionType is multiple_choice',
            },
            correctOptionIndex: {
              type: Type.INTEGER,
              description: 'Zero-based index of the correct choice if multiple_choice',
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
    return JSON.parse(text) as GeneratedQuestion;
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
Expected Evidence of Understanding: ${question.expectedEvidence.join(', ')}

Student's Answer: "${response.answer}"
Student's Self-Reported Confidence: "${response.confidence || 'unspecified'}"

Evaluate the student's answer.
Did they demonstrate genuine conceptual understanding?
If incorrect, identify the specific misconception and provide a constructive Socratic hint rather than bluntly telling them the final solution.`;

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
            feedback: { type: Type.STRING, description: 'Socratic feedback message to the student' },
            detectedMisconception: { type: Type.STRING, nullable: true },
            recommendation: {
              type: Type.STRING,
              enum: ['advance', 'probe_deeper', 'descend_prerequisite', 'retry'],
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
