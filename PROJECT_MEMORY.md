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

**Phase 4 — Adaptive Tutoring & Multi-Type Interactions (Complete)**

### What exists

- `backend/` — Express 5 + TypeScript backend with Supabase integration
  - Auth middleware (JWT validation)
  - Routes: health, courses, concepts, profiles, and tutor
  - Database migrations applied (9 tables, RLS, indexes, seed data verified in Supabase)
  - AI Provider Layer: `AIProvider` interface with `GeminiProvider` (@google/genai) and `MockAIProvider` fallback
  - `TutorEngine` service: session orchestration, Socratic question generation, reasoning evaluation, hint ladder (Levels 1–7), and student mastery transitions
  - **Prerequisite Descent and Ascent**: Automated graph search on `concept_relationships` for missing prerequisites, descent question generation, prerequisite mastery updates, and ascent back to target concept
  - **Confidence vs. Accuracy Calibration**: Engine computes overconfidence / underconfidence diagnostics based on student self-reported confidence vs score
  - Automated test suite: `backend/src/test_adaptive_tutoring.ts` (21 assertions passed via `npm test`)
- `mobile/` — React Native + Expo SDK 57
  - Supabase Auth (client-side, per DEC-PEN-02)
  - Auth screens (login, register)
  - Curriculum browsing (dashboard → course → topic → concept)
  - Interactive Socratic AI Tutor Session screen (`/(main)/tutor/[id]`) with:
    - Multiple Choice selectable cards
    - **Multiple Selection (`multiple_select`)** checkbox options
    - **Step Ordering / Sequence (`ordering`)** interactive cards with up/down arrows
    - Short text reasoning input
    - **Prerequisite Descent Drill banner** & history badges
    - **Confidence Calibration diagnostic badges** (trap warnings & encouragement)
    - Self-reported confidence chip selector
    - Multi-level hint ladder card
    - Socratic evaluation feedback and session completion review
  - API client with auto JWT injection for all curriculum and tutor endpoints

### What is next

- Phase 5: Problem Solving & Visual Interactivity (LeetCode-style problem browser, visual arrays/pointer tracing, code runner)

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

Phase 3: First AI Tutor Vertical Slice:
- AI provider layer (`AIProvider`, `GeminiProvider`, `MockAIProvider`, factory)
- Tutor Engine service (`tutorEngine.ts`) with knowledge state transitions
- Tutor API routes (`/api/tutor/session`, `/respond`, `/hint`)
- Mobile Socratic learning screen (`/tutor/[id]`) with MCQ, text reasoning, hint ladder, and confidence indicator
- Wired "Start Learning" button on Concept Detail screen

### Current task

First Vertical Slice is complete and verified end-to-end.

### Immediate next step

Engage in user testing of the Socratic tutor loop on mobile/web. Then proceed to Phase 4: Adaptive Tutoring Expansion (automated prerequisite descent).

### Current blocker

None.

### Files recently modified

- `backend/src/services/ai/aiProvider.ts` (NEW)
- `backend/src/services/ai/geminiProvider.ts` (NEW)
- `backend/src/services/ai/mockProvider.ts` (NEW)
- `backend/src/services/ai/index.ts` (NEW)
- `backend/src/services/tutorEngine.ts` (NEW)
- `backend/src/routes/tutor.ts` (NEW)
- `backend/src/index.ts` (MODIFY)
- `mobile/src/lib/api.ts` (MODIFY)
- `mobile/src/app/(main)/concept/[id].tsx` (MODIFY)
- `mobile/src/app/(main)/tutor/[id].tsx` (NEW)
- `TASKS.md`, `DECISIONS.md`, `CHANGELOG.md`, `PROJECT_MEMORY.md`

### Important implementation detail

If `GEMINI_API_KEY` is provided in `backend/.env`, the system automatically uses Gemini 2.5 Flash with structured JSON schemas. If no key is set, it falls back to `MockAIProvider` with curated Binary Search Socratic dialogue and full 7-level hint ladder.