# CHANGELOG

All meaningful project changes should be recorded here.

---

# Format

```text
## YYYY-MM-DD

### Added
-

### Changed
-

### Fixed
-

### Removed
-

### Architectural
-

### Documentation
-
```


---

# 2026-09-21 — Phase 4: Adaptive Tutoring & Multi-Type Interactions

### Added

- Automated **Prerequisite Descent and Ascent** (`AI_TUTOR_ENGINE.md` §4, `DEC-003`):
  - `TutorEngine.findUnmasteredPrerequisite`: Graph traversal over `concept_relationships` to detect unmastered prerequisite gaps.
  - Automated descent trigger: Generates targeted prerequisite questions when student struggles or AI recommends descent.
  - Automated ascent trigger: Updates prerequisite mastery in `student_knowledge` and seamlessly transitions back to the target concept upon score >= 0.8.
  - Mobile UI Prerequisite Drill banner on active questions and badge on historical interactions.
- Multiple Interaction Types:
  - **Multiple Selection** (`multiple_select`): Checkbox option cards supporting multi-select logic and validation.
  - **Step Ordering / Sequence** (`ordering`): Interactive arrangement of algorithmic operations with up/down sequence controls.
- **Confidence vs. Accuracy Calibration** (`AI_TUTOR_ENGINE.md` §7):
  - Detects overconfidence (`confident` + wrong) to warn about subtle algorithmic traps.
  - Detects underconfidence (`unsure` + correct) to encourage student analytical confidence.
  - Visual calibration badges displayed in evaluation cards on mobile.
- Automated Test Suite:
  - `backend/src/test_adaptive_tutoring.ts`: 21 automated end-to-end assertions testing MCQ, multi-select, ordering, calibration, descent, ascent, and hints.
  - `npm test` script in `backend/package.json`.

---

# 2026-09-20 — Phase 3: First AI Tutor Vertical Slice

### Added

- `backend/src/services/ai/` — AI provider abstraction layer
  - `aiProvider.ts` — Canonical `AIProvider` interface, types for `TutorContext`, `GeneratedQuestion`, `StudentResponse`, `EvaluationResult`, `GeneratedHint`
  - `geminiProvider.ts` — Concrete Google Gemini API provider using `@google/genai` (model: `gemini-2.5-flash`) with structured JSON schema output
  - `mockProvider.ts` — High-fidelity deterministic fallback provider for offline development and test execution
  - `index.ts` — AI provider factory with automatic fallback when `GEMINI_API_KEY` is not present
- `backend/src/services/tutorEngine.ts` — Core Tutor Engine service
  - Socratic question generation and response evaluation orchestration
  - Knowledge state update logic with mastery state transitions (`UNKNOWN` → `INTRODUCED` → `LEARNING` → `DEVELOPING` → `PROFICIENT` → `MASTERED`)
  - Multi-level hint ladder escalation (Levels 1–7)
  - Active session resumption and interaction persistence in `learning_sessions` and `interactions`
- `backend/src/routes/tutor.ts` — Express routes under `/api/tutor`
  - `POST /api/tutor/session` — Start or resume tutoring session for a concept
  - `GET /api/tutor/session/:id` — Retrieve active session and interaction history
  - `POST /api/tutor/session/:id/respond` — Submit reasoning, evaluate, update knowledge, generate next interaction
  - `POST /api/tutor/session/:id/hint` — Request next hint on the hint ladder
- `mobile/src/lib/api.ts` — Client methods for Tutor Engine (`startTutorSession`, `getTutorSession`, `submitTutorResponse`, `requestTutorHint`)
- `mobile/src/app/(main)/tutor/[id].tsx` — Interactive Socratic tutoring session screen
  - Socratic conversation history stream
  - Low-friction response modes (MCQ selectable cards, short-text explanation)
  - Self-reported confidence chip selector
  - Hint ladder escalation card
  - Socratic evaluation feedback and session completion review
- Connected "Start Learning" button on Concept Detail screen to start real sessions

### Changed

- Updated `mobile/.env` and `backend/.env` with sanitized Supabase project root URL
- Configured `mobile/app.json` web output to `"single"` for stable client-side SPA rendering
- Upgraded `mobile/src/lib/supabase.ts` with SSR-safe storage adapter

---

# 2026-09-20 — Phase 1: Project Foundation

### Added

- `backend/` — Express 5 + TypeScript backend application
  - Supabase client configuration (service role)
  - JWT authentication middleware (validates Supabase tokens)
  - Routes: health, courses, concepts, profiles
  - Error handler middleware
  - Environment validation on startup
- `backend/supabase/migrations/001_foundation.sql` — Foundation database schema
  - 9 tables: profiles, courses, modules, topics, concepts, concept_relationships, student_knowledge, learning_sessions, interactions
  - Row-Level Security policies for all tables
  - Indexes for common query patterns
  - Auto-profile trigger on user signup
- `backend/supabase/migrations/002_seed_data.sql` — DSA seed curriculum
  - 1 course, 2 modules, 4 topics, 7 concepts with prerequisite graph
- `mobile/` — React Native + Expo SDK 57 application
  - Supabase Auth context (client-side auth per DEC-PEN-02)
  - API client with automatic JWT header injection
  - Auth screens: login, register
  - Main screens: dashboard, course detail, topic detail, concept detail
  - Auth-based navigation (redirect to login if unauthenticated)
- `.env.example` files for both backend and mobile
- `.gitignore` for the project

### Architectural

- Resolved DEC-PEN-01: Backend framework → Express
- Resolved DEC-PEN-02: Authentication → Supabase Auth (client-side SDK)
- Resolved DEC-PEN-03: Session strategy → Supabase session tokens

---

# 2026-09-19 — Documentation Reconciliation


### Added

- Topics table added to DATABASE_SPEC.md (completes Module→Topic→Concept chain).
- Patterns table added to DATABASE_SPEC.md (backing table for Problem Patterns join).
- Student Pattern Knowledge table added to DATABASE_SPEC.md.
- Client/Server boundary section added to ARCHITECTURE.md §8.
- Latency management section added to AI_TUTOR_ENGINE.md §14.
- Recovery strategy added to AI_TUTOR_ENGINE.md §13.
- Canonical ownership headers added to AI_TUTOR_ENGINE.md, PRODUCT_SPEC.md.
- 6 pending decisions (DEC-PEN-01 through DEC-PEN-06) added to DECISIONS.md.
- 3 deferred decisions (DEC-DEF-01 through DEC-DEF-03) added to DECISIONS.md.
- FYP Core Scope vs Future/Aspirational Scope boundary added to DEVELOPMENT_PLAN.md.
- FYP Deliverable Checkpoint added to DEVELOPMENT_PLAN.md.
- Cross-references added throughout documentation suite.

### Changed

- Knowledge state labels unified: UNKNOWN is the enum value, "Not introduced" is the display label (KNOWLEDGE_MODEL.md §4, FEATURE_SPEC.md).
- ARCHITECTURE.md diagram: Content Engine renamed to Curriculum/Content; all components clarified as backend modules.
- README.md architecture diagram aligned with ARCHITECTURE.md.
- TASKS.md phase numbering split into Phase 0 (Documentation) and Phase 1 (Foundation) to match DEVELOPMENT_PLAN.md.
- Backend responsibilities in ARCHITECTURE.md §4 split into direct vs delegated (to Tutor Engine and Curriculum/Content modules).
- AI Provider placement standardized: it is a service behind the Tutor Engine, not a peer of Student Model.
- PROJECT_MEMORY.md architecture diagram aligned with ARCHITECTURE.md.
- DATABASE_SPEC.md Revision Items table: removed premature `interval` and `difficulty` fields (deferred to DEC-DEF-03).
- KNOWLEDGE_MODEL.md: MVP implementation levels clarified; hierarchy example annotated.

### Fixed

- DATABASE_SPEC.md: Missing Topics table (Concepts referenced topic_id but no Topics table existed).
- DATABASE_SPEC.md: Missing Patterns table (Problem Patterns join table had nothing to join to).
- DATABASE_SPEC.md: Broken Module→Topic→Concept hierarchy chain.
- TASKS.md: Phase numbering mismatch with DEVELOPMENT_PLAN.md.
- FEATURE_SPEC.md: Knowledge state labels inconsistent with KNOWLEDGE_MODEL.md.
- ARCHITECTURE.md: Undefined Content Engine replaced with Curriculum/Content module.
- README.md: Architecture diagram contradicted ARCHITECTURE.md.

### Architectural

- Clarified that all server-side components are modules within a single backend (not separate services).
- Established AI_TUTOR_ENGINE.md as canonical source for tutor loop, interactions, hints, AI provider interface.
- Established PRODUCT_SPEC.md as canonical source for product scope and curriculum.
- Established ARCHITECTURE.md as canonical source for system architecture and client/server boundaries.

### Documentation

- Dates added to all 7 existing decisions in DECISIONS.md.
- Pending/Deferred status types defined in DECISIONS.md.
- CONTENT_SYSTEM.md cross-referenced to ARCHITECTURE.md Curriculum/Content module.
- AI_CONTEXT.md backend reading list updated to include CONTENT_SYSTEM.md.
- Handoff template in PROJECT_MEMORY.md consolidated with TASKS.md reference.

---

# 2026-09-19

### Added

- Initial project concept established.
- Adaptive AI Socratic tutoring model defined.
- DSA learning track defined.
- Problem-solving pattern learning defined.
- LeetCode-style practice concept defined.
- System Design learning track defined.
- Multiple response modalities defined.
- Student knowledge model concept defined.
- Prerequisite descent concept defined.
- Free-first technology strategy defined.
- AI provider abstraction defined.
- Project documentation/memory architecture defined.

### Changed

None.

### Fixed

None.

### Architectural

Initial architecture documented.

### Documentation

Initial project documentation set created.