/**
 * AI Provider abstraction interface.
 *
 * Based on AI_TUTOR_ENGINE.md §10.
 * Decouples the Tutor Engine orchestration from specific AI models.
 */

export interface InteractionSummary {
  interactionType: string;
  question: any;
  studentResponse: any;
  evaluation: any;
  hintLevel: number;
}

export interface TutorContext {
  conceptId: string;
  conceptName: string;
  conceptDescription: string;
  learningObjectives: string[];
  masteryState: string;
  difficulty?: string;
  prerequisites?: Array<{ id: string; name: string }>;
  recentInteractions: InteractionSummary[];
  isPrerequisiteDescent?: boolean;
  descentReason?: string;
}

export interface GeneratedQuestion {
  interactionType:
    | 'multiple_choice'
    | 'multiple_select'
    | 'ordering'
    | 'short_text'
    | 'prediction'
    | 'code_completion';
  questionText: string;
  options?: string[];
  correctOptionIndex?: number;
  correctOptionIndices?: number[];
  orderingItems?: string[];
  correctOrder?: number[];
  expectedEvidence: string[];
  objective: string;
  conceptId?: string;
  conceptName?: string;
  isPrerequisiteDescent?: boolean;
  descentReason?: string;
}

export interface StudentResponse {
  answer: string; // Can be option index, comma-separated indices, or ordered list of item indices
  confidence?: 'confident' | 'somewhat_confident' | 'unsure' | 'dont_know';
}

export interface CalibrationResult {
  type: 'overconfident' | 'underconfident' | 'calibrated';
  message: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  understandingDemonstrated: boolean;
  score: number; // 0.0 to 1.0
  feedback: string;
  detectedMisconception?: string | null;
  calibration?: CalibrationResult;
  recommendation: 'advance' | 'probe_deeper' | 'descend_prerequisite' | 'ascend_target' | 'retry';
  recommendedPrerequisiteConceptId?: string;
}

export interface GeneratedHint {
  hintLevel: number;
  hintTitle: string;
  hintContent: string;
}

export interface CodeReviewResult {
  isOptimal: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  feedback: string;
  detectedIssues: string[];
  socraticQuestions: string[];
  nextHint: string;
}

export interface AIProvider {
  /**
   * Generate the next Socratic question or task for a concept.
   */
  generateQuestion(context: TutorContext): Promise<GeneratedQuestion>;

  /**
   * Evaluate a student's answer or reasoning.
   */
  evaluateResponse(
    context: TutorContext,
    question: GeneratedQuestion,
    response: StudentResponse
  ): Promise<EvaluationResult>;

  /**
   * Generate a targeted hint according to the hint ladder (Levels 1–7).
   */
  generateHint(
    context: TutorContext,
    question: GeneratedQuestion,
    hintLevel: number
  ): Promise<GeneratedHint>;

  /**
   * Socratic code review analyzing time/space complexity, edge cases, and structural invariants.
   */
  reviewCode(
    problem: { title: string; description: string; constraints: string[] },
    code: string,
    language: string,
    testSummary: { passed: number; total: number; failedTests: any[] }
  ): Promise<CodeReviewResult>;
}

