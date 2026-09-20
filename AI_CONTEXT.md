# AI CONTEXT — Adaptive CS Learning Platform

## 1. Purpose of This File

This file is the primary context file for AI coding agents working on this project.

Any AI agent joining the project should read this file first, followed by the relevant supporting documentation listed below.

The purpose is to allow development to continue across different AI agents, models, IDEs, accounts, conversations, and context windows without requiring the project owner to repeatedly explain the entire project.

---

# 2. Project Identity

## Working Name

**AlgoMentor AI**

The name is provisional and may change.

## Project Type

AI-powered adaptive learning platform for Computer Science students.

## Initial Domain

Data Structures & Algorithms (DSA)

## Planned Additional Domains

- LeetCode/problem-solving patterns
- Competitive-programming-style problem solving
- System Design
- Computer Science fundamentals
- Potentially additional CS subjects in the future

## Initial Platform

Mobile application.

## Initial Technology Direction

- React Native
- Expo
- TypeScript
- Node.js backend
- PostgreSQL/Supabase
- AI API with a replaceable provider architecture

The exact technologies may evolve. See `TECH_STACK.md`.

---

# 3. Core Product Idea

The application is NOT intended to be merely an AI chatbot that explains DSA.

The central concept is:

> **An adaptive AI tutor that continuously models what a student understands, identifies gaps in prerequisite knowledge, and teaches through interactive Socratic dialogue.**

The core learning loop is:

```text
Assess
   ↓
Identify knowledge state
   ↓
Locate missing prerequisite
   ↓
Choose teaching/interactions
   ↓
Ask student to reason
   ↓
Evaluate response
   ↓
Update student model
   ↓
Understanding sufficient?
   ├── NO → descend into prerequisite knowledge
   └── YES → move upward toward application
```

See `AI_TUTOR_ENGINE.md` §2 for the canonical implementation-level core loop.

The application should make responding easy while keeping thinking unavoidable.

### Fundamental design principle

> **Make responding easy; make thinking unavoidable.**

---

# 4. Core Educational Philosophy

The system should prioritize:

- Active learning
- Socratic questioning
- Retrieval
- Reasoning
- Conceptual understanding
- Pattern recognition
- Application
- Reflection
- Adaptive difficulty
- Prerequisite diagnosis

The system should avoid turning learning into passive consumption.

The AI should not immediately provide answers whenever the student struggles.

Instead, it should determine what the student is missing and guide them toward understanding.

---

# 5. Interaction Philosophy

Students should not be forced to type long explanations on a mobile device.

The system should support multiple ways of demonstrating understanding:

- Multiple choice
- Multiple selection
- Ordering
- Matching
- Fill-in-the-blank
- Code completion
- Predicting output
- Algorithm tracing
- Visual manipulation
- Drag-and-drop
- Short text
- Long-form explanation when useful
- Code writing
- Voice explanation
- Confidence selection
- "I know"
- "I'm unsure"
- "I don't know"
- Hint requests

The AI should select an appropriate interaction type based on what evidence of understanding it needs.

See `AI_TUTOR_ENGINE.md` §3 and §9 for the canonical interaction type list and selection logic.

---

# 6. Important Distinction

Correctness does NOT automatically equal understanding.

For example:

If a student correctly answers:

> Binary Search is O(log n).

The system may still investigate whether they understand why.

Possible follow-up:

> "Why?"

or:

> "If the search space has 1,024 elements, roughly how many halvings are needed?"

The tutor is interested in evidence of understanding, not merely correct answers.

---

# 7. Adaptive Learning Principle

The system should be able to move downward into prerequisites.

Example:

```text
Binary Search
      ↓
Search Space Reduction
      ↓
Sorted Data
      ↓
Ordering
      ↓
Comparisons
```

If the student demonstrates sufficient understanding, the system moves upward again:

```text
Comparisons
      ↑
Sorted Data
      ↑
Search Space
      ↑
Binary Search
      ↑
Binary Search Problems
```

This descent-and-reconstruction behavior is a defining feature of the application.

---

# 8. AI Architecture Principle

The LLM must NOT control the entire application.

The application should contain a deterministic/structured Tutor Engine responsible for:

- Curriculum state
- Knowledge state
- Prerequisites
- Student progress
- Interaction selection
- Difficulty
- Hint levels
- Session state
- Learning objectives

The LLM should primarily handle:

- Natural-language generation
- Socratic dialogue
- Explanation
- Interpretation of free-text reasoning
- Interpretation of voice transcripts
- Generating variations of questions
- Evaluating reasoning where appropriate

Conceptually:

```text
Student
   ↓
Tutor Engine
   ↓
Student Model + Knowledge Graph
   ↓
Learning Objective
   ↓
Interaction Selection
   ↓
LLM
   ↓
Natural-language interaction
   ↓
Student response
   ↓
Evaluation
   ↓
Tutor Engine
```

---

# 9. Major Application Areas

The planned application contains:

1. Onboarding
2. Student profile
3. Dashboard
4. Learning paths
5. Concept learning
6. DSA curriculum
7. DSA patterns
8. Problem solving
9. LeetCode-style practice
10. Interactive algorithm visualizations
11. Code editor
12. AI hints
13. System Design learning
14. Knowledge map
15. Progress tracking
16. Revision system
17. Weakness detection
18. Confidence tracking
19. AI mentor
20. Settings

---

# 10. Current Development Philosophy

The project may become large.

Do not attempt to implement the entire vision at once.

Development should happen incrementally.

Always prioritize:

1. Working core
2. Strong architecture
3. Small vertical slices
4. Testing
5. Documentation
6. Incremental expansion

Do not build elaborate infrastructure before there is a concrete feature that requires it.

---

# 11. Documentation Hierarchy

Read files according to the task.

### Always read

- `AI_CONTEXT.md`
- `PROJECT_MEMORY.md`
- `DEVELOPMENT_RULES.md`
- `TASKS.md`

### Product work

Read:

- `PRODUCT_SPEC.md`
- `FEATURE_SPEC.md`
- `UI_UX_SPEC.md`

### AI/tutoring work

Read:

- `AI_TUTOR_ENGINE.md`
- `KNOWLEDGE_MODEL.md`
- `CONTENT_SYSTEM.md`

### Backend work

Read:

- `ARCHITECTURE.md`
- `DATABASE_SPEC.md`
- `API_SPEC.md`
- `SECURITY.md`
- `CONTENT_SYSTEM.md`

### Planning

Read:

- `DEVELOPMENT_PLAN.md`
- `DECISIONS.md`

### Debugging/maintenance

Read:

- `PROJECT_MEMORY.md`
- `CHANGELOG.md`
- relevant architecture/spec files

---

# 12. Critical Agent Rules

Before modifying code:

1. Understand the existing implementation.
2. Read the relevant documentation.
3. Search the repository before creating new abstractions.
4. Do not duplicate existing functionality.
5. Do not silently change established architecture.
6. Do not remove features merely because they are inconvenient.
7. Do not replace working systems with different technologies without justification.
8. Keep changes focused.
9. Test changes.
10. Update documentation when architectural or behavioral decisions change.

If uncertain, inspect first rather than guessing.

---

# 13. Current Status

This project has completed **Phase 1 — Project Foundation**.

The backend (Express + TypeScript) and mobile app (React Native + Expo) have been scaffolded with authentication, curriculum browsing, and database schema.

The next milestone is the **First Vertical Slice** — connecting the Tutor Engine through an AI provider to deliver the core adaptive tutoring loop.

---

# 14. Current Priority

The immediate priority is:

> Establish the project structure, technical foundation, core data model, and first vertical slice of the adaptive AI tutoring experience.

The first vertical slice should demonstrate:

```text
Student selects a concept
        ↓
Tutor assesses knowledge
        ↓
Student responds
        ↓
AI evaluates understanding
        ↓
Tutor identifies gap
        ↓
Tutor asks next question
        ↓
Knowledge state updates
```

This should work end-to-end before attempting to implement the entire application.

---

# 15. Agent Handoff Rule

When an AI agent finishes meaningful work, it should update:

- `PROJECT_MEMORY.md`
- `TASKS.md`
- `CHANGELOG.md`

If an architectural decision was made, also update:

- `DECISIONS.md`

The next agent should be able to continue without relying on the previous conversation.

---

# 16. Source of Truth

The repository documentation is the persistent source of project context.

Chat conversations are temporary.

If a decision is important enough that future agents need to know it, record it in the appropriate `.md` file.