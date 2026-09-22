/**
 * Mock AI Provider for Phase 4 Adaptive Tutoring.
 *
 * Provides curated Socratic questions, hint ladders, and evaluations
 * supporting multiple interaction types (MCQ, Multiple Select, Ordering, Short Text)
 * and prerequisite descent scenarios.
 */

import {
  AIProvider,
  TutorContext,
  GeneratedQuestion,
  StudentResponse,
  EvaluationResult,
  GeneratedHint,
  CodeReviewResult,
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
    const conceptLower = context.conceptName.toLowerCase();
    const interactionCount = context.recentInteractions.length;

    // Prerequisite Descent: Sorted Arrays
    if (context.isPrerequisiteDescent || conceptLower.includes('sorted array')) {
      return {
        interactionType: 'multiple_choice',
        questionText:
          'In a sorted array, if our target value is strictly less than the middle element (target < arr[mid]), what can we mathematically conclude about all elements to the right of mid?',
        options: [
          'They are all >= arr[mid], so our target cannot possibly exist anywhere in the right half',
          'They might still contain the target if there are negative numbers',
          'We cannot conclude anything without checking each element one by one',
          'The target must be located at the very last index',
        ],
        correctOptionIndex: 0,
        expectedEvidence: ['understands directional property of sorted data', 'recognizes safe elimination'],
        objective: 'Master the sorted prerequisite enabling directional elimination',
        conceptId: context.conceptId,
        conceptName: context.conceptName,
        isPrerequisiteDescent: true,
        descentReason: context.descentReason || 'Foundational sorted array property check',
      };
    }

    // Prerequisite Descent: Search Space Reduction
    if (conceptLower.includes('search space reduction')) {
      return {
        interactionType: 'multiple_choice',
        questionText:
          'If an algorithm eliminates 50% of remaining candidates in a single comparison, how many candidates remain after 3 comparisons if we start with 64?',
        options: ['8 candidates (64 → 32 → 16 → 8)', '16 candidates', '32 candidates', '0 candidates'],
        correctOptionIndex: 0,
        expectedEvidence: ['understands halving candidates'],
        objective: 'Understand geometric search space reduction',
        conceptId: context.conceptId,
        conceptName: context.conceptName,
        isPrerequisiteDescent: true,
        descentReason: 'Search space halving prerequisite',
      };
    }

    // Binary Search Root Concept — Adaptive Progression across interaction types
    if (conceptLower.includes('binary search')) {
      if (interactionCount === 0) {
        // Step 1: Multiple Choice
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
          conceptId: context.conceptId,
          conceptName: context.conceptName,
        };
      }

      if (interactionCount === 1) {
        // Step 2: Multiple Select (Checkboxes)
        return {
          interactionType: 'multiple_select',
          questionText:
            'Which of the following conditions are STRICT PREREQUISITES for standard Binary Search to execute correctly? (Select all that apply)',
          options: [
            'The collection elements must be arranged in sorted order',
            'The data structure must allow O(1) random access by index (e.g. array)',
            'All values in the collection must be positive integers',
            'We must maintain explicit boundaries for the remaining search space (left and right pointers)',
          ],
          correctOptionIndices: [0, 1, 3],
          expectedEvidence: ['identifies sorted requirement', 'identifies random access', 'rejects positive-only restriction'],
          objective: 'Identify mandatory preconditions for binary search',
          conceptId: context.conceptId,
          conceptName: context.conceptName,
        };
      }

      if (interactionCount === 2) {
        // Step 3: Ordering / Sequence (Algorithmic steps)
        return {
          interactionType: 'ordering',
          questionText:
            'Arrange the following operations in the exact logical sequence executed during one iteration of Binary Search:',
          orderingItems: [
            'Calculate midpoint index: mid = left + (right - left) // 2',
            'Compare target with arr[mid]',
            'Check if arr[mid] == target (return mid if found)',
            'Adjust search boundary: if target < arr[mid] set right = mid - 1, else left = mid + 1',
          ],
          correctOrder: [0, 1, 2, 3],
          expectedEvidence: ['correct execution sequence of binary search iteration'],
          objective: 'Execute and trace binary search loop body invariant',
          conceptId: context.conceptId,
          conceptName: context.conceptName,
        };
      }

      // Step 4+: Short Text Reasoning
      return {
        interactionType: 'short_text',
        questionText:
          'Why does halving a search space of size n repeatedly result in O(log n) time complexity rather than O(n)? Explain the mathematical connection between halving and logarithms.',
        expectedEvidence: ['connects halving to log2(n)', 'explains inverse of exponentiation'],
        objective: 'Connect halving to logarithmic time complexity',
        conceptId: context.conceptId,
        conceptName: context.conceptName,
      };
    }

    // Generic concept fallback
    return {
      interactionType: 'multiple_choice',
      questionText: `Let's test our understanding of ${context.conceptName}: What is the primary characteristic of ${context.conceptName}?`,
      options: [
        `It provides an optimal or efficient structure for ${context.conceptName} operations`,
        `It operates randomly without predictable invariants`,
        `It only works on empty collections`,
        `None of the above`,
      ],
      correctOptionIndex: 0,
      expectedEvidence: [`identifies purpose of ${context.conceptName}`],
      objective: context.learningObjectives[0] || `Master ${context.conceptName}`,
      conceptId: context.conceptId,
      conceptName: context.conceptName,
    };
  }

  async evaluateResponse(
    context: TutorContext,
    question: GeneratedQuestion,
    response: StudentResponse
  ): Promise<EvaluationResult> {
    const rawAnswer = response.answer.trim();
    let isCorrect = false;
    let score = 0.0;
    let feedback = '';
    let recommendation: EvaluationResult['recommendation'] = 'advance';

    // 1. Multiple Choice Evaluation
    if (question.interactionType === 'multiple_choice') {
      const selectedIndex = parseInt(rawAnswer, 10);
      isCorrect = Boolean(
        question.correctOptionIndex !== undefined &&
          (selectedIndex === question.correctOptionIndex ||
            (question.options &&
              question.options[question.correctOptionIndex]?.toLowerCase() === rawAnswer.toLowerCase()))
      );

      score = isCorrect ? 1.0 : 0.0;
      if (isCorrect) {
        feedback =
          'Spot on! By comparing with the middle element, we discard half the remaining search space with each single check.';
        recommendation = 'advance';
      } else {
        feedback =
          'Not quite. Think about how we can take advantage of the elements being in sorted order without inspecting every single one.';
        recommendation = 'descend_prerequisite';
      }
    }

    // 2. Multiple Select Evaluation
    else if (question.interactionType === 'multiple_select') {
      let selectedIndices: number[] = [];
      try {
        if (rawAnswer.startsWith('[')) {
          selectedIndices = JSON.parse(rawAnswer);
        } else {
          selectedIndices = rawAnswer
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));
        }
      } catch {
        selectedIndices = [];
      }

      const correct = (question.correctOptionIndices || []).slice().sort();
      const selected = selectedIndices.slice().sort();

      const isExact =
        correct.length === selected.length &&
        correct.every((val, index) => val === selected[index]);

      if (isExact) {
        isCorrect = true;
        score = 1.0;
        feedback =
          'Excellent! Binary Search strictly requires sorted order, O(1) random access by index, and search boundaries. Elements do NOT have to be positive integers — negative values, strings, and floats work identically!';
        recommendation = 'advance';
      } else {
        const missedAny = correct.some((c) => !selected.includes(c));
        const includedNegativeRestriction = selected.includes(2);

        isCorrect = false;
        score = 0.4;
        if (includedNegativeRestriction) {
          feedback =
            'Close! Note that Binary Search works for any type with a defined total ordering (including negative numbers and strings). Only sorted order, indexable access, and search boundaries are required.';
        } else if (missedAny) {
          feedback =
            'You caught some key conditions, but missed at least one mandatory prerequisite. Remember that calculating mid requires random indexed access in O(1).';
        } else {
          feedback = 'Review the prerequisites needed to eliminate half the search space reliably.';
        }
        recommendation = 'probe_deeper';
      }
    }

    // 3. Ordering / Sequence Evaluation
    else if (question.interactionType === 'ordering') {
      let orderIndices: number[] = [];
      try {
        if (rawAnswer.startsWith('[')) {
          orderIndices = JSON.parse(rawAnswer);
        } else {
          orderIndices = rawAnswer
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));
        }
      } catch {
        orderIndices = [];
      }

      const expected = question.correctOrder || [0, 1, 2, 3];
      const isExactOrder =
        orderIndices.length === expected.length &&
        orderIndices.every((val, index) => val === expected[index]);

      if (isExactOrder) {
        isCorrect = true;
        score = 1.0;
        feedback =
          'Perfect sequence! First compute the midpoint, compare with target, test for equality, and finally shrink the left or right boundary.';
        recommendation = 'advance';
      } else {
        isCorrect = false;
        score = 0.3;
        feedback =
          'Check the order of operations: we must always compute the midpoint before we can inspect or compare `arr[mid]`.';
        recommendation = 'probe_deeper';
      }
    }

    // 4. Short Text Reasoning Evaluation
    else {
      const lower = rawAnswer.toLowerCase();
      const mentionsLogOrHalving =
        (lower.includes('half') || lower.includes('halv') || lower.includes('divide')) &&
        (lower.includes('log') || lower.includes('power') || lower.includes('2^'));

      if (mentionsLogOrHalving || rawAnswer.length > 25) {
        isCorrect = true;
        score = 0.95;
        feedback =
          'Brilliant mathematical reasoning! Because we divide by 2 at each step, after k steps we have n / 2^k candidates. Setting n / 2^k = 1 yields k = log₂(n).';
        recommendation = 'advance';
      } else {
        isCorrect = false;
        score = 0.35;
        feedback =
          'Good attempt, but connect the repeated division by 2 explicitly to logarithms (which represent the inverse of powers of 2).';
        recommendation = 'probe_deeper';
      }
    }

    // Compute Confidence Calibration
    let calibration: EvaluationResult['calibration'];
    if (response.confidence === 'confident' && score < 0.5) {
      calibration = {
        type: 'overconfident',
        message:
          '💡 Surprising Trap: You felt very confident here, but fell into a common pitfall. Recognizing these deceptive traps is how mastery is built.',
      };
    } else if (response.confidence === 'unsure' && score >= 0.8) {
      calibration = {
        type: 'underconfident',
        message:
          '🌟 Trust Your Instincts: You reported feeling unsure, but your reasoning was completely correct! Be confident in your analytical deduction.',
      };
    } else {
      calibration = {
        type: 'calibrated',
        message: 'Your self-reported confidence accurately matched your demonstrated understanding.',
      };
    }

    return {
      isCorrect,
      understandingDemonstrated: score >= 0.7,
      score,
      feedback,
      calibration,
      recommendation,
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
      1: 'Ask yourself: what property of the data allows us to completely ignore an entire half without reading its elements?',
      2: 'Remember: sorted data gives directional certainty. If target < arr[mid], target cannot be anywhere to the right.',
      3: 'This is the "Search Space Halving" invariant.',
      4: 'Look at how pointers move: `left = mid + 1` or `right = mid - 1`.',
      5: '`mid = left + (right - left) // 2`\n`if arr[mid] == target: return mid`\n`elif target < arr[mid]: right = mid - 1`\n`else: left = mid + 1`',
      6: 'Watch out for integer overflow in other languages: using `left + (right - left) // 2` is safer than `(left + right) // 2`.',
      7: 'Full explanation: Binary search requires sorted order and indexable O(1) random access. Each step tests the median element and discards n/2 items, yielding log2(n) worst-case time complexity.',
    };

    return {
      hintLevel: level,
      hintTitle: title,
      hintContent: hints[level] || hints[1],
    };
  }

  async reviewCode(
    problem: { title: string; description: string; constraints: string[] },
    code: string,
    language: string,
    testSummary: { passed: number; total: number; failedTests: any[] }
  ): Promise<CodeReviewResult> {
    const codeLower = code.toLowerCase();

    const usesLinearScan =
      (codeLower.includes('for ') || codeLower.includes('for(')) &&
      !codeLower.includes('mid') &&
      (codeLower.includes('indexof') || codeLower.includes('find(') || codeLower.includes('return i'));

    const usesLoopCondition = codeLower.includes('left <= right') || codeLower.includes('left < right');
    const usesMidCalculation = codeLower.includes('mid') && (codeLower.includes('left +') || codeLower.includes('/ 2') || codeLower.includes('// 2'));
    const handlesBoundaryShift = codeLower.includes('mid + 1') || codeLower.includes('mid - 1');

    if (testSummary.passed === testSummary.total && testSummary.total > 0) {
      if (usesLinearScan) {
        return {
          isOptimal: false,
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)',
          feedback:
            '⚠️ Functional but Sub-optimal: Your code passed the test cases, but it uses an O(n) linear scan! The problem requires O(log n) logarithmic time. Take advantage of the array being sorted to eliminate half the candidates per comparison.',
          detectedIssues: ['Linear O(n) search instead of O(log n) binary search'],
          socraticQuestions: [
            'If the array is already sorted, do you need to inspect every element sequentially?',
            'What happens if the array has 10,000,000 elements? How many comparisons would binary search take compared to your loop?',
          ],
          nextHint: 'Calculate a midpoint `mid = left + Math.floor((right - left) / 2)` and compare target with `nums[mid]`.',
        };
      }

      return {
        isOptimal: true,
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        feedback:
          '🌟 Optimal Solution! Excellent binary search implementation. You correctly maintain the search interval boundaries, avoid integer overflow in midpoint calculation, and achieve O(log n) time complexity.',
        detectedIssues: [],
        socraticQuestions: [
          'What would happen if the array contained duplicate target values? How would you find the FIRST occurrence?',
        ],
        nextHint: 'Challenge: Try solving "Find First and Last Position of Element in Sorted Array" using this exact template.',
      };
    }

    // Failed some or all tests
    const detectedIssues: string[] = [];
    const socraticQuestions: string[] = [];

    if (!usesLoopCondition) {
      detectedIssues.push('Search space boundary condition missing or incorrect (should be left <= right or left < right)');
      socraticQuestions.push('What is the terminating condition for your search window? Can the window ever collapse when left exceeds right?');
    }

    if (!usesMidCalculation) {
      detectedIssues.push('Midpoint index calculation missing');
      socraticQuestions.push('How do you divide the remaining search range in half each iteration?');
    }

    if (!handlesBoundaryShift) {
      detectedIssues.push('Boundary pointer adjustment may cause an infinite loop (make sure to use mid + 1 or mid - 1)');
      socraticQuestions.push('If target is not at mid, does mid still need to be in the remaining search space?');
    }

    return {
      isOptimal: false,
      timeComplexity: 'Sub-optimal or Incomplete',
      spaceComplexity: 'O(1)',
      feedback: `Your solution passed ${testSummary.passed}/${testSummary.total} test cases. Focus on maintaining loop invariants: ensure pointers shrink the window each step without skipping the target.`,
      detectedIssues,
      socraticQuestions:
        socraticQuestions.length > 0
          ? socraticQuestions
          : ['Walk through a 2-element array example on paper: nums = [2, 5], target = 5. Where do your pointers land?'],
      nextHint: 'Initialize `let left = 0, right = nums.length - 1;` and loop `while (left <= right)`.',
    };
  }
}
