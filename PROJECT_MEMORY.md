# PROJECT MEMORY

## Purpose

This file records the evolving state of the project.

It should contain decisions, discoveries, implementation realities, unresolved problems, important constraints, and lessons learned that future AI agents need to know.

This is not a replacement for detailed specifications.

It is the project's **living memory**.

---

# 1. Project Vision

The project is an AI-powered adaptive learning platform for Computer Science students.

The initial focus is DSA, with planned expansion into:

- DSA patterns
- Problem solving
- LeetCode-style problems
- System Design
- Additional CS subjects

The application uses an adaptive Socratic tutoring model.

The AI should diagnose what the student understands, identify missing prerequisites, and guide the student toward independent understanding.

---

# 2. Core Principle

> Make responding easy; make thinking unavoidable.

The application should minimize friction in answering while maximizing cognitive engagement.

Students should be able to respond through:

- Choices
- Selection
- Ordering
- Matching
- Short text
- Voice
- Code
- Visual interaction
- Free-form reasoning

---

# 3. Current Product Status

Status:

**Phase 10 — Final Polish, Full Suite Verification & Production Readiness (COMPLETE)**

### What exists

- `backend/` — Express 5 + TypeScript backend with Supabase integration
  - Auth middleware (JWT validation and optional auth fallback)
  - Routes: health, courses, concepts, profiles, tutor, problems, revision, and system-design
  - Database migrations: 001_foundation, 002_seed_data, 003_problems_and_patterns, 004_revision_system, 005_system_design
  - AI Provider Layer: `AIProvider` interface with `GeminiProvider` (`gemini-3.6-flash` via @google/genai) and `MockAIProvider` fallback
  - `CodeRunnerService`: Isolated Node.js `vm` sandbox without process/fs/network access, 1,000ms execution timeout per test case, regex user function extraction
  - `ProblemsService`: Curated LeetCode problems and DSA patterns
  - `RevisionService`: SuperMemo SM-2 algorithm with calibration confidence and 5-box Leitner categorization
  - `SystemDesignService`: Production scale scenarios, back-of-the-envelope calculations, and Socratic architectural evaluation
  - Socratic AI Code Reviewer & Verbal Reasoning Evaluator
  - Automated test suites: 117 assertions passing across all suites (`npm test`):
    - `test_adaptive_tutoring.ts` (21 assertions)
    - `test_problem_solving.ts` (18 assertions)
    - `test_interactive_visualizers.ts` (17 assertions)
    - `test_voice_reasoning.ts` (15 assertions)
    - `test_spaced_repetition.ts` (25 assertions)
    - `test_system_design.ts` (21 assertions)
- `mobile/` — React Native + Expo SDK 57
  - Supabase Auth (client-side, per DEC-PEN-02)
  - Auth screens (login, register)
  - Curriculum browsing (dashboard → course → topic → concept)
  - Interactive Socratic AI Tutor Session screen (`/(main)/tutor/[id]`) with MCQ, multi-select, step ordering, prerequisite descent/ascent, confidence calibration, and verbal reasoning modal
  - **VisualArrayTrace**: Step-by-step interactive array invariant tracer showing Left/Mid/Right pointers, search space elimination, and condition explanations
  - **DSA Problem & Pattern Catalog (`/(main)/problems/index`)**: Search, difficulty filtering, pattern chips, and deep-dive Pattern Explorer tab
  - **Problem Workspace (`/(main)/problems/[id]`)**: Multi-tab environment featuring Problem Statement with embedded `VisualArrayTrace`, Code Editor, Test Results runner, Socratic AI Review panel, 5-level Graduated Hint Ladder, and Verbal Reasoning Studio trigger
  - **Interactive Mental Model Components**:
    - `VisualTreeTraversal.tsx`: Interactive Binary Tree traversal (Pre-order, In-order, Post-order, Level-order BFS) with call stack and queue visualization
    - `VisualGraphTraversal.tsx`: Interactive Graph traversal (BFS Queue vs DFS Stack) with visited set tracking and cycle avoidance
    - `VisualTwoPointerSlidingWindow.tsx`: Two-pointer collision on sorted arrays and sliding window sum updates in $O(1)$ time
    - `VisualDPMatrix.tsx`: Dynamic Programming 2D table explorer for Grid Unique Paths and 0/1 Knapsack with dependency cell indicators
    - `VisualComplexityComparator.tsx`: Real-time Big-O growth simulator with $N$ selector ($N = 10$ to $10,000$), step counts, and 1 GHz CPU execution time estimates
  - **Mental Models Gallery & Playground (`/(main)/visualizers/index` & `[type]`)**
  - **Verbal Reasoning Studio (`/(main)/voice/index`)**: Native Web Speech API / dictation integration with editable live transcription and Socratic interview delivery review
  - **Revision & Spaced Repetition (`/(main)/revision/index` & `practice`)**: Visual 5-box Leitner distribution, daily retrieval streak, and active recall flashcards
  - **System Design Studio (`/(main)/system-design/index` & `[id]`)**: Production architecture scenarios with back-of-the-envelope scale estimation, component builder, and Socratic trade-off analysis
  - Dashboard launcher cards connecting all modules

### What is next

- All FYP deliverable phases (0 through 10) are complete and verified. Ready for user demonstration, academic evaluation, and production deployment.

---

# 4. Confirmed Product Decisions

## Decision: Adaptive Socratic tutoring

The application should not function primarily as a question-answer chatbot.

The tutor should ask questions and progressively build understanding.

## Decision: Prerequisite descent

When a student does not understand a concept, the tutor should be able to move to prerequisite concepts.

## Decision: Multiple response modalities

The student should not be forced to type long explanations.

## Decision: Knowledge modeling

The system should maintain structured knowledge state rather than only conversation history.

## Decision: Replaceable AI provider

AI services must be abstracted so that the project is not permanently dependent on one provider.

## Decision: Free-first development

The project should initially be developed using free/open-source tools and free service tiers wherever practical.

No architectural decision should depend on an unlimited free API.

---

# 5. Important Product Insight

The most important distinction from a normal AI education application is:

> The application is designed to determine whether the student actually understands something, not merely whether they produced a correct answer.

Therefore, the system may ask follow-up questions even after a correct answer.

---

# 6. Example Learning Behavior

Student:

> "I don't understand Binary Search."

Tutor:

> "Let's find out what part is unclear."

Tutor checks:

1. Does the student understand arrays?
2. Does the student understand sorted ordering?
3. Does the student understand comparisons?
4. Does the student understand eliminating impossible candidates?
5. Does the student understand reducing the search space?

If a prerequisite is missing, the tutor teaches it.

Once understood, the tutor returns to Binary Search.

---

# 7. Current Architecture Direction

```text
React Native
      ↓
API / Backend
      │
      ├── Authentication
      ├── Tutor Engine
      │     ├── Student Model
      │     ├── Knowledge Graph
      │     └── AI Provider
      └── Curriculum / Content
      ↓
Database (PostgreSQL / Supabase)
```

All components are modules within a single backend. See `ARCHITECTURE.md` for the canonical architecture diagram.

Exact architecture remains subject to implementation.

---

# 8. Current Technology Direction

Initial direction:

- React Native
- Expo
- TypeScript
- Node.js
- PostgreSQL/Supabase
- AI API
- Git/GitHub

Exact choices must be documented in `TECH_STACK.md`.

---

# 9. Free/Low-Cost Constraint

The project is intended to be developed without requiring paid software or APIs.

Possible tools/services include:

- VS Code
- Google Antigravity
- Cursor free availability where applicable
- GitHub
- Git
- Expo
- Supabase free tier
- Cloudflare free services where appropriate
- Gemini API free tier
- Open-source libraries
- Figma free tier
- Other free/open-source tools

Free-tier limits must never be assumed to be unlimited.

---

# 10. External Educational Resources

The project may use established resources such as DSA roadmaps and educational platforms as references for:

- Curriculum structure
- Topic ordering
- Problem categories
- Pattern classification
- Learning paths

Do not copy proprietary educational content without appropriate permission.

Prefer:

- Public/open resources
- Links
- Metadata
- Original explanations
- Properly licensed material

---

# 11. Current Open Questions

These are intentionally unresolved until implementation/research:

- Exact AI provider configuration
- Exact database schema
- Exact knowledge graph representation
- Exact curriculum source
- Voice provider
- Speech-to-text implementation
- Code execution environment
- Offline functionality
- Authentication provider
- Deployment architecture
- Exact problem dataset/source
- Whether a separate backend is necessary for every feature

Agents should not make major decisions about these without documenting them.

---

# 12. Lessons Learned

This section should be continuously updated.

### Rule

Whenever implementation reveals something important that future developers would otherwise have to rediscover, record it here.

- **Supabase URL formatting:** Supabase project URL should never contain `/rest/v1`. The SDK appends specific path segments (e.g. `/auth/v1/signup`, `/rest/v1/...`). Both `mobile/src/lib/supabase.ts` and `backend/src/config/env.ts` now defensively strip accidental `/rest/v1` and trailing slashes.
- **Expo Router Web SSR:** Web pre-rendering (`output: "static"`) runs in Node.js where `window` is undefined. Using `output: "single"` in `app.json` and wrapping `AsyncStorage` with an SSR-safe storage adapter prevents `ReferenceError: window is not defined`.
- **AI Provider Fallback:** The application includes a deterministic `MockAIProvider` so development and automated tests run seamlessly even without an external API key or network connectivity.

---

# 13. Known Problems

### Resolved: Supabase signup path error
- **Problem:** "Invalid path specified in request URL" during signup.
- **Cause:** `.env` had `https://...supabase.co/rest/v1/` instead of `https://...supabase.co`.
- **Permanent solution:** Fixed `.env` and added defensive sanitization in `supabase.ts` and `env.ts`.
- **Status:** Resolved.

### Resolved: Web SSR window error
- **Problem:** `ReferenceError: window is not defined` when running web export.
- **Cause:** Static pre-rendering tried to access `window.localStorage` in Node.js.
- **Permanent solution:** Configured `web.output: "single"` in `app.json` and added SSR-safe storage adapter.
- **Status:** Resolved.

---

# 14. Handoff Notes

### Last completed task

Phase 7 (Voice & Verbal Reasoning), Phase 8 (Revision & Spaced Repetition), Phase 9 (System Design), and Phase 10 (Final Polish & Verification):
- AI verbal evaluation engine & Web Speech API reasoning modal (`VoiceReasoningModal.tsx`, `voice/index.tsx`)
- SuperMemo SM-2 spaced repetition service with 5-box Leitner categorization and active retrieval flashcards (`revision/index.tsx`, `revision/practice.tsx`)
- System Design curriculum with back-of-the-envelope scale estimation, component builder, and Socratic trade-off consultant (`system-design/index.tsx`, `system-design/[id].tsx`)
- 117 automated unit and integration tests passing with 100% pass rate
- Clean TypeScript compilation across backend and mobile (`npx tsc --noEmit`)

### Current task

All architectural phases of AlgoMentor AI are complete, integrated, and verified.

### Immediate next step

End-to-end user testing on device / browser, followed by final graduation/FYP deliverable review.

### Current blocker

None.

### Important implementation details

- **Free-First AI Engine (DEC-006):** When `GEMINI_API_KEY` is present in `backend/.env`, the system leverages `gemini-3.6-flash` with structured JSON output. If network issues or rate limits occur, it seamlessly falls back to the deterministic `MockAIProvider` without breaking student sessions.
- **Node.js Sandbox (DEC-DEF-01):** Code is safely executed in an isolated VM context with wall-clock timeout protection.
- **Client-Side Speech API (DEC-DEF-02):** Speech recognition is done client-side with an editable live transcript, avoiding metered API costs.
- **SM-2 Spaced Repetition (DEC-DEF-03):** Calculates interval progression based on recall accuracy and confidence calibration.