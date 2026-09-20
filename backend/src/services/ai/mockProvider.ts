/**
 * Mock AI Provider for offline testing, CI, and development without an active API key.
 *
 * Provides curated Socratic questions and evaluations for core DSA concepts
 * (e.g. Binary Search, Search Space Reduction, Sorted Array) and dynamic
 * fallback questions for any other concept.
 */

import {
  AIProvider,
  TutorContext,
  GeneratedQuestion,
  StudentResponse,
  EvaluationResult,
  GeneratedHint,
} from './aiProvider';

const HINT_TITLES: Record<number, string> = {
  1: 'Level 1: Socratic Question',
  2: 'Level 2: Conceptual Clue',
  3: 'Level 3: Pattern Clue',
  4: 'Level 4: Algorithmic Clue',
  5: 'Level 5: Pseudocode',
  6: 'Level 6: Implementation Guidance',
  7: 'Level 7: Full Walkthrough',
};

export class MockAIProvider implements AIProvider {
  async generateQuestion(context: TutorContext): Promise<GeneratedQuestion> {
    const isBinarySearch = context.conceptName.toLowerCase().includes('binary search');
    const interactionCount = context.recentInteractions.length;

    if (isBinarySearch) {
      if (interactionCount === 0) {
        return {
          interactionType: 'multiple_choice',
          questionText:
            'Suppose you have a sorted array of 1,024 elements and you want to find a target value. In Binary Search, what fundamental operation do we perform at each step?',
          options: [
            'Scan elements one by one from left to right',
            'Compare the target with the middle element to eliminate half the candidates',
            'Sort the array into ascending order',
            'Pick a random element and restart if not found',
          ],
          correctOptionIndex: 1,
          expectedEvidence: ['understands middle comparison', 'understands eliminating half'],
          objective: 'Understand binary search division of search space',
        };
      }

      if (interactionCount === 1) {
        return {
          interactionType: 'short_text',
          questionText:
            'Why does Binary Search strictly require the underlying collection to be sorted? What would happen if the array were unsorted?',
          expectedEvidence: ['sorted order allows deterministic elimination', 'unsorted cannot eliminate halves'],
          objective: 'Understand the sorted requirement prerequisite',
        };
      }

      return {
        interactionType: 'multiple_choice',
        questionText:
          'If the array size is 1,024, at most how many comparisons are needed in the worst case to locate the target or verify it is absent?',
        options: ['1,024 comparisons', '512 comparisons', '10 comparisons (since 2^10 = 1,024)', '1 comparison'],
        correctOptionIndex: 2,
        expectedEvidence: ['understands log2(n) relationship'],
        objective: 'Connect halving to logarithmic time complexity',
      };
    }

    // Dynamic contextual question for any other concept
    const objective = context.learningObjectives[0] || `Master ${context.conceptName}`;
    return {
      interactionType: 'multiple_choice',
      questionText: `Let's test our understanding of ${context.conceptName}: What is the primary purpose of ${context.conceptName}?`,
      options: [
        `To efficiently solve problems related to ${context.conceptName}`,
        `A brute-force strategy that checks every possibility`,
        `A theoretical model with no practical use`,
        `None of the above`,
      ],
      correctOptionIndex: 0,
      expectedEvidence: [`identifies purpose of ${context.conceptName}`],
      objective,
    };
  }

  async evaluateResponse(
    context: TutorContext,
    question: GeneratedQuestion,
    response: StudentResponse
  ): Promise<EvaluationResult> {
    const rawAnswer = response.answer.trim();

    if (question.interactionType === 'multiple_choice') {
      const selectedIndex = parseInt(rawAnswer, 10);
      const isCorrect =
        question.correctOptionIndex !== undefined &&
        (selectedIndex === question.correctOptionIndex ||
          (question.options &&
            question.options[question.correctOptionIndex]?.toLowerCase() === rawAnswer.toLowerCase()));

      if (isCorrect) {
        return {
          isCorrect: true,
          understandingDemonstrated: true,
          score: 1.0,
          feedback:
            'Spot on! By comparing with the middle element, we discard half the remaining search space with each single check.',
          recommendation: 'advance',
        };
      } else {
        return {
          isCorrect: false,
          understandingDemonstrated: false,
          score: 0.0,
          feedback:
            "Not quite. Think about how we can take advantage of the elements being in sorted order without inspecting every single one.",
          detectedMisconception: 'Linear scanning assumption',
          recommendation: 'probe_deeper',
        };
      }
    }

    // Short text evaluation
    const lower = rawAnswer.toLowerCase();
    const mentionsElimination =
      lower.includes('eliminat') ||
      lower.includes('half') ||
      lower.includes('order') ||
      lower.includes('know where') ||
      lower.includes('direction') ||
      lower.includes('left or right');

    if (mentionsElimination || rawAnswer.length > 20) {
      return {
        isCorrect: true,
        understandingDemonstrated: true,
        score: 0.9,
        feedback:
          'Great reasoning! Without sorted order, knowing that a target is greater than the middle element tells us nothing about which half it lives in.',
        recommendation: 'advance',
      };
    }

    return {
      isCorrect: false,
      understandingDemonstrated: false,
      score: 0.3,
      feedback:
        'You have the right intuition, but consider: if the numbers are scattered randomly, can we safely throw away either half after checking the middle?',
      detectedMisconception: 'Unclear on why unsorted breaks directional elimination',
      recommendation: 'probe_deeper',
    };
  }

  async generateHint(
    context: TutorContext,
    question: GeneratedQuestion,
    hintLevel: number
  ): Promise<GeneratedHint> {
    const level = Math.min(Math.max(hintLevel, 1), 7);
    const title = HINT_TITLES[level] || `Hint Level ${level}`;

    const hints: Record<number, string> = {
      1: 'Ask yourself: if the book is alphabetized, what do you do when the word you are looking for starts with "M" and you open to "T"?',
      2: 'Remember that sorted data gives you directional knowledge: everything to the left is smaller, and everything to the right is larger.',
      3: 'This is the "Divide and Conquer" pattern applied to an indexed collection.',
      4: 'Look at the midpoint: `mid = left + (right - left) // 2`. If `target < arr[mid]`, where must target be?',
      5: '`if arr[mid] == target: return mid`\n`elif target < arr[mid]: right = mid - 1`\n`else: left = mid + 1`',
      6: 'Initialize two pointers: `left = 0`, `right = len(arr) - 1`. Loop while `left <= right`. Compute `mid` each iteration.',
      7: 'Full explanation: Binary Search halves the candidates every iteration. Starting with n, after k iterations we have n / 2^k elements. When n / 2^k = 1, k = log2(n). This is why 1,024 elements take at most 10 steps.',
    };

    return {
      hintLevel: level,
      hintTitle: title,
      hintContent: hints[level] || hints[1],
    };
  }
}
