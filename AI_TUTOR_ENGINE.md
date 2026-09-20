# AI TUTOR ENGINE

This document is the **canonical source** for:

- The core tutoring loop
- Interaction types and selection logic
- Hint ladder levels
- AI provider interface
- Prerequisite descent behavior
- Tutor session management

Other documents may summarize or reference these concepts, but this document is authoritative.

---

# 1. Purpose

The Tutor Engine is the core intelligence/orchestration layer of the application.

It is a **server-side backend module** (see `ARCHITECTURE.md` §4).

Its purpose is to determine:

> What should this student experience next?

The LLM is a component of the Tutor Engine, not the Tutor Engine itself.

---

# 2. Core Loop

```text
Current Learning Objective
        ↓
Student Knowledge State
        ↓
Evidence Required
        ↓
Interaction Selection
        ↓
Question Generation
        ↓
Student Response
        ↓
Response Evaluation
        ↓
Knowledge State Update
        ↓
Next Action
```

---

# 3. Possible Tutor Actions

The tutor may:

- Ask conceptual question
- Ask MCQ
- Ask multiple selection
- Ask ordering question
- Ask prediction question
- Ask code question
- Ask visual interaction
- Request explanation
- Request voice explanation
- Provide hint
- Provide example
- Explain prerequisite
- Move to easier concept
- Move to harder concept
- Give practice problem
- Request independent solution
- Review solution
- Trigger revision

---

# 4. Prerequisite Descent

If a student fails to demonstrate understanding:

```text
Current Concept
      ↓
Identify prerequisite
      ↓
Check prerequisite
      ↓
Understood?
  ├── YES → return upward
  └── NO → descend again
```

The system should avoid endlessly descending.

There should be:

- Maximum depth
- Fallback explanation
- Alternative teaching approach
- Explicit "student is stuck" state

---

# 5. Evidence of Understanding

Evidence can come from:

- Correct answer
- Explanation
- Application
- Prediction
- Code implementation
- Pattern recognition
- Transfer to novel problem
- Ability to explain why
- Ability to identify incorrect reasoning

Evidence should be weighted differently.

---

# 6. Correctness vs Understanding

A correct answer is evidence but not necessarily proof.

The system can request additional evidence.

Example:

Student:

> "Binary Search is O(log n)."

Tutor:

> "Why?"

Student:

> "Because we cut the search space roughly in half every step."

Tutor:

> "Good. What determines how many times we can halve n before reaching one element?"

This gives stronger evidence.

---

# 7. Confidence

The student may report:

- Confident
- Somewhat confident
- Unsure
- Don't know

The system should compare this with actual performance.

---

# 8. Hint Ladder (canonical definition)

Hints should escalate gradually. This is the authoritative list of hint levels.

Level 0:

No hint.

Level 1:

Socratic question.

Level 2:

Conceptual clue.

Level 3:

Pattern clue.

Level 4:

Algorithmic clue.

Level 5:

Pseudocode.

Level 6:

Implementation guidance.

Level 7:

Full explanation.

---

# 9. Interaction Selection

The Tutor Engine should select the interaction based on the learning objective.

Example:

If objective = "Understand why binary search is logarithmic":

Use:

- Conceptual explanation
- Prediction
- Numerical reasoning

If objective = "Implement binary search":

Use:

- Code completion
- Trace
- Coding task

If objective = "Recognize binary search problems":

Use:

- Problem classification
- Pattern selection
- Comparison questions

---

# 10. AI Provider Abstraction

The tutor should never depend directly on a specific AI provider.

Use:

```text
AIProvider
├── generateTutorResponse()
├── evaluateResponse()
├── generateQuestion()
├── generateHint()
└── analyzeReasoning()
```

Providers can include:

- Gemini
- Other API provider
- Local/open model

The exact interface may evolve.

---

# 11. Structured AI Responses

Where possible, the AI should return structured data rather than uncontrolled prose.

Example conceptual response:

```json
{
  "interactionType": "multiple_choice",
  "objective": "search_space_reduction",
  "difficulty": "beginner",
  "question": "...",
  "options": [],
  "expectedEvidence": [],
  "hintLevel": 0
}
```

The actual schema should be defined in implementation. See `DECISIONS.md` DEC-PEN-06 for the structured output enforcement strategy.

---

# 12. Safety Against Over-Helping

The tutor should not reveal the complete solution prematurely.

The student should be given opportunities to reason first.

---

# 13. AI Failure Handling

The system should handle:

- Invalid AI response
- Malformed structured output
- API timeout
- Rate limit
- Provider unavailable
- Hallucinated information
- Contradictory explanation

The application should fail gracefully.

### Recovery strategy

- **Session state is persisted server-side** after each interaction. If an AI call fails mid-session, the session can be resumed from the last completed interaction.
- **Retry with backoff** for transient failures (timeout, rate limit).
- **Fallback response** if retry fails: display a generic "unable to generate response" message and offer the student the option to retry, skip, or request a simpler question.
- **No student progress is lost** on failure — only uncommitted interactions are discarded.

---

# 14. Latency Management

AI responses may take 2–10+ seconds, especially on free-tier APIs.

The system should:

- Show a clear loading/thinking indicator during AI calls.
- Consider streaming responses where the provider supports it.
- Prevent duplicate submissions while a response is pending.
- Not block the UI — the student should be able to review previous interactions while waiting.

Exact latency thresholds and streaming behavior should be determined during Phase 3 implementation.

---

# 15. Important Principle

The LLM should generate language.

The application should maintain state.

Do not store the entire student model solely inside prompts.

See `DECISIONS.md` DEC-PEN-04 for the tutor session context strategy.