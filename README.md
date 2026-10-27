# 🧠 AlgoMentor AI

### Adaptive Socratic Learning for Computer Science

> **Make responding easy. Make thinking unavoidable.**

AlgoMentor AI is an adaptive learning platform designed to help Computer Science students genuinely understand **Data Structures, Algorithms, problem-solving patterns, and System Design**.

Unlike a conventional AI chatbot, AlgoMentor does not simply explain a concept or reveal a solution.

It tries to determine:

> **What does the student actually understand?**

and then adapts the learning experience accordingly.

---

## 🎯 The Idea

```text
Student
   ↓
Assessment
   ↓
Understanding Detection
   ↓
Find Knowledge Gap
   ↓
Teach Prerequisite
   ↓
Question
   ↓
Student Reasoning
   ↓
Evaluate
   ↓
Build Understanding
   ↓
Apply Independently
```

If a student does not understand an advanced concept, the tutor can move backward through its prerequisites until it reaches something the student understands.

It can then build upward again.

---

## 🧩 Multiple Ways to Learn

Students should not have to write long answers on a mobile device.

The tutor can use:

- 🎯 Multiple choice
- ☑️ Multiple selection
- 🔀 Ordering
- 🧩 Matching
- ✏️ Fill in the blank
- 💻 Code completion
- 🔍 Algorithm tracing
- 🎨 Visual interaction
- 🎙️ Voice explanations
- ⌨️ Text responses
- 🧠 Free-form reasoning

The objective is simple:

> **Reduce response friction without reducing cognitive effort.**

---

## 📚 Learning Tracks

### Data Structures & Algorithms

- Arrays
- Strings
- Linked Lists
- Stacks
- Queues
- Hash Tables
- Trees
- Graphs
- Heaps
- Searching
- Sorting
- Recursion
- Backtracking
- Greedy
- Dynamic Programming

### Problem-Solving Patterns

- Two Pointers
- Sliding Window
- Hashing
- Prefix Sum
- Binary Search
- BFS / DFS
- Backtracking
- Greedy
- Heap / Top-K
- Intervals
- Union-Find
- Dynamic Programming

### System Design

- Requirements
- APIs
- Databases
- Caching
- Load Balancing
- Scalability
- Reliability
- Architecture
- Trade-offs

---

## 🤖 What Makes It Different?

A correct answer does not necessarily mean the student understands.

The tutor can ask:

> **Why?**

It can then investigate the reasoning behind the answer and identify misconceptions or missing prerequisites.

The system maintains a model of the student's learning state rather than treating every conversation as independent.

---

## 🗺️ Knowledge Map

Concepts are connected through prerequisite relationships.

Example:

```text
             Binary Search
                   │
           Search Space
                   │
              Sorted Data
                   │
              Comparisons
```

This allows the tutor to move downward when necessary and build back upward.

---

## 🧪 Problem Solving

Students can progressively receive help:

```text
Independent
     ↓
Socratic Question
     ↓
Conceptual Hint
     ↓
Pattern Hint
     ↓
Algorithm Hint
     ↓
Pseudocode
     ↓
Implementation Guidance
     ↓
Full Explanation
```

The goal is not to solve every problem for the student.

The goal is to make the student increasingly capable of solving problems independently.

---

## 🛠️ Technology

Initial technology direction:

- React Native
- Expo
- TypeScript
- Node.js
- PostgreSQL / Supabase
- AI provider abstraction
- Gemini / other free AI providers
- Git & GitHub

The project follows a **free-first** development strategy.

---

## 🏗️ Architecture

```text
                 React Native
                      │
                      ↓
                  Backend
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
Authentication  Tutor Engine   Curriculum /
                      │          Content
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
 Student Model Knowledge Graph AI Provider
        │             │             │
        └─────────────┼─────────────┘
                      │
                   Database
```

See `ARCHITECTURE.md` for the full technical architecture.

---

## 🚀 Project Status

**Phases 0 through 11 — Complete & Verified.**

All platform capabilities are implemented, integrated, and validated:
- ✅ **Socratic AI Tutor**: Gemini 3.6 Flash + deterministic offline MockAIProvider fallback.
- ✅ **Adaptive Knowledge Engine**: Dynamic prerequisite descent/ascent, confidence calibration, and a 7-level tutor hint ladder.
- ✅ **Curriculum**: 3 courses, 12 modules, 17 topics, 40 concepts, and 30 prerequisite relationships, seeded idempotently from canonical source data.
- ✅ **Problem Solving Studio**: 30 problems and 15 patterns with a code editor, isolated child-process JavaScript sandbox, per-test plus hard timeouts, 3-tier hints, and a Socratic AI code reviewer.
- ✅ **Progress Dashboard**: Real mastery, attempt, revision, streak, weak-topic, and recent-activity metrics derived from learner data (no hardcoded values).
- ✅ **Interactive Mental Models**: BST traversals, Graph BFS/DFS, Two-Pointer sliding window, DP Matrix, and Big-O asymptotic comparator.
- ✅ **Verbal Reasoning Studio**: Web Speech API transcription with editable transcripts on web, keyboard dictation/text fallback on native, plus Socratic delivery feedback.
- ✅ **Revision & Spaced Repetition**: SuperMemo SM-2 algorithm with 5-box Leitner categorization and active retrieval flashcards.
- ✅ **System Design Learning Track**: Production scale scenarios (URL Shortener, Chat, Rate Limiter) with an interactive component topology builder and trade-off consultant.
- ✅ **Production Hardening**: Authenticated protected routes, per-user/IP rate limits, CORS allowlist, security headers, request-body caps, sanitized errors, and durable local fallbacks when optional migrations are absent.
- ✅ **Verification**: Zero TypeScript compilation errors and **159 / 159 automated unit and integration assertions passing**. CI, Docker, EAS, and deployment guidance are included (see [`DEPLOYMENT.md`](DEPLOYMENT.md)).

---

## 📖 Project Documentation

AI/developer documentation is maintained inside the repository:

| File | Purpose |
|---|---|
| `AI_CONTEXT.md` | Entry point for AI coding agents |
| `PROJECT_MEMORY.md` | Persistent project memory |
| `PRODUCT_SPEC.md` | Product vision and requirements |
| `FEATURE_SPEC.md` | Feature inventory |
| `AI_TUTOR_ENGINE.md` | Adaptive tutoring architecture |
| `KNOWLEDGE_MODEL.md` | Student and concept model |
| `CONTENT_SYSTEM.md` | Educational content architecture |
| `ARCHITECTURE.md` | Technical architecture |
| `TECH_STACK.md` | Technology decisions |
| `DEVELOPMENT_PLAN.md` | Development roadmap |
| `DEVELOPMENT_RULES.md` | Development rules |
| `DATABASE_SPEC.md` | Database design |
| `API_SPEC.md` | Backend API |
| `UI_UX_SPEC.md` | Interface principles |
| `TESTING_PLAN.md` | Testing strategy |
| `SECURITY.md` | Security principles |
| `DECISIONS.md` | Important decisions |
| `TASKS.md` | Active task board |
| `CHANGELOG.md` | Project history |
| `DEPLOYMENT.md` | Supabase, backend Docker, EAS, CORS, and CI setup |

---

## 🎓 Project Objective

The ultimate goal is not to create another platform that gives students answers.

It is to create a system that helps students **learn how to think**.

> **Don't just tell the student what the answer is.**
>
> **Help the student become capable of finding the answer.**