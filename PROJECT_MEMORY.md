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

**Phase 11 — Production Hardening, Real Progress & Deployment (COMPLETE)**

### What exists

- `backend/` — Express 5 + TypeScript backend with Supabase integration
  - Auth middleware (mandatory JWT validation on all learner data routes)
  - Routes: health, courses, concepts, profiles, tutor, problems, revision, system-design, and progress
  - Database migrations: 001_foundation, 003_problems_and_patterns, 004_revision_system, 005_system_design; `002_seed_data.sql` remains a legacy bootstrap seed, superseded by the canonical idempotent seeder (`npm run seed:curriculum` → 3 courses, 12 modules, 17 topics, 40 concepts, 30 relationships, 15 patterns, 30 problems)
  - AI Provider Layer: `AIProvider` interface with `GeminiProvider` (`gemini-3.6-flash` via @google/genai) and `MockAIProvider` fallback
  - `CodeRunnerService`: Isolated child-process JavaScript sandbox (`codeRunnerWorker.cjs`), per-test VM timeout, parent hard-kill, 128 MB heap cap, output caps, blocked globals and dynamic code; non-JavaScript languages rejected
  - `ProblemsService`: 30 curated problems and 15 DSA patterns
  - `RevisionService`: SuperMemo SM-2 algorithm with calibration confidence and 5-box Leitner categorization
  - `SystemDesignService`: Production scale scenarios, back-of-the-envelope calculations, and Socratic architectural evaluation
  - `ProgressService`: Real mastery, problem, revision, streak, weak-topic, course, misconception, and recent-activity aggregation
  - API hardening: per-user/IP rate limits, CORS allowlist, security headers, 128 KB JSON body cap, sanitized error responses, opt-in `TRUST_PROXY` for a single trusted reverse proxy
  - Durable local JSON fallback (`LOCAL_STORE_PATH`, default `backend/data/local-store.json`) for attempts, revision state/logs, and misconceptions when optional tables are absent
  - Socratic AI Code Reviewer & Verbal Reasoning Evaluator
  - Automated test suites: 159 assertions passing across nine suites (`npm test`):
    - `test_adaptive_tutoring.ts` (21 assertions)
    - `test_problem_solving.ts` (18 assertions)
    - `test_interactive_visualizers.ts` (17 assertions)
    - `test_voice_reasoning.ts` (15 assertions)
    - `test_spaced_repetition.ts` (25 assertions)
    - `test_system_design.ts` (21 assertions)
    - `test_code_execution_security.ts` (11 assertions)
    - `test_api_security.ts` (10 assertions)
    - `test_progress_persistence.ts` (21 assertions)
- `mobile/` — React Native + Expo SDK 57
  - Supabase Auth (client-side, per DEC-PEN-02)
  - Auth screens (login, register)
  - Curriculum browsing (dashboard → course → topic → concept)
  - Interactive Socratic AI Tutor Session screen (`/(main)/tutor/[id]`) with MCQ, multi-select, step ordering, prerequisite descent/ascent, confidence calibration, and verbal reasoning modal
  - **VisualArrayTrace**: Step-by-step interactive array invariant tracer showing Left/Mid/Right pointers, search space elimination, and condition explanations
  - **DSA Problem & Pattern Catalog (`/(main)/problems/index`)**: Search, difficulty filtering, pattern chips, and deep-dive Pattern Explorer tab
  - **Problem Workspace (`/(main)/problems/[id]`)**: Multi-tab environment featuring Problem Statement with embedded `VisualArrayTrace`, Code Editor, Test Results runner, Socratic AI Review panel, 3-tier Graduated Hint Ladder, and Verbal Reasoning Studio trigger
  - **Interactive Mental Model Components**:
    - `VisualTreeTraversal.tsx`: Interactive Binary Tree traversal (Pre-order, In-order, Post-order, Level-order BFS) with call stack and queue visualization
    - `VisualGraphTraversal.tsx`: Interactive Graph traversal (BFS Queue vs DFS Stack) with visited set tracking and cycle avoidance
    - `VisualTwoPointerSlidingWindow.tsx`: Two-pointer collision on sorted arrays and sliding window sum updates in $O(1)$ time
    - `VisualDPMatrix.tsx`: Dynamic Programming 2D table explorer for Grid Unique Paths and 0/1 Knapsack with dependency cell indicators
    - `VisualComplexityComparator.tsx`: Real-time Big-O growth simulator with $N$ selector ($N = 10$ to $10,000$), step counts, and 1 GHz CPU execution time estimates
  - **Mental Models Gallery & Playground (`/(main)/visualizers/index` & `[type]`)**
  - **Verbal Reasoning Studio (`/(main)/voice/index`)**: Web Speech API transcription with editable live transcript on web; clear keyboard-dictation/text-entry fallback on native; inline permission/network errors; Socratic interview delivery review
  - Revision & Spaced Repetition (`/(main)/revision/index` & `practice`): Visual 5-box Leitner distribution, daily retrieval streak, and active recall flashcards
  - System Design Studio (`/(main)/system-design/index` & `[id]`): Production architecture scenarios with back-of-the-envelope scale estimation, component builder, and Socratic trade-off analysis
  - **Modern UI Redesign & Floating Dock Navigation (Phase 10 Polish)**:
    - Replaced the bulky, vertically-stacked banner cards with an **Obsidian / Cyber Dark command center** inspired by Linear, Raycast, and AlgoMaster.io.
    - **Floating Glassmorphic Bottom Navigation Dock (`BottomNavBar.tsx`)**: Persistent 1-tap switching across all 5 core modules (Roadmap, Practice, Visualizers, Revision, System Design Studio) with active indicators and safe-area insets.
    - **Dashboard Command Center**:
      - Edge-to-edge custom header with user avatar, status badge, real activity streak pill, and modal signout.
      - **Daily Invariant Hero Mission Card** highlighting algorithmic retrieval progress.
      - **2x2 Bento Action Hub** with glowing accent borders for rapid access to key studios.
      - **Live Learning Metrics Bar** fed by `GET /api/progress/summary` (mastery, problems attempted/solved, patterns, due reviews, retention, streak) rather than hardcoded values.
      - Continue-learning, weak-topic, recent-activity, and per-course progress sections reflect actual learner records.
      - **AlgoMaster Pathway Tracks** with interactive filter pills (All, Fundamentals, 15 Patterns, System Design).
    - Unified dark canvas palette (`#070A11`, `#0E1322`, `#141A29`, `#1C2436`) across course, topic, concept, and index sub-screens.

### What is next

- Deploy the backend, web app, and mobile builds using [`DEPLOYMENT.md`](DEPLOYMENT.md); then run authenticated browser/device smoke tests and iterate on user feedback. All core modules, test suites (159/159 passing), and UI workflows are implemented.

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

Resolved during implementation: AI provider (Gemini + deterministic mock), database schema and migrations, knowledge graph representation (prerequisite edges in `curriculum.ts` / `concept_relationships`), canonical curriculum source (3 courses / 12 modules / 17 topics / 40 concepts / 30 relationships), voice implementation (Web Speech API on web + keyboard fallback on native), code execution (isolated JavaScript worker process), authentication (Supabase Auth), problem dataset (30 curated problems / 15 patterns), and the separate backend (implemented with Express).

Remaining before/after launch:

- Production hosting provider and region.
- Shared rate-limit store if the API runs more than one instance.
- Native speech-to-text provider (current native path is keyboard dictation/text entry).
- Additional execution languages (only JavaScript is supported).
- Content expansion beyond the current 40 concepts / 30 problems.
- Offline behavior remains out of scope.

Agents should not make major decisions about these without documenting them.

---

# 12. Lessons Learned

This section should be continuously updated.

### Rule

Whenever implementation reveals something important that future developers would otherwise have to rediscover, record it here.

- **Supabase URL formatting:** Supabase project URL should never contain `/rest/v1`. The SDK appends specific path segments (e.g. `/auth/v1/signup`, `/rest/v1/...`). Both `mobile/src/lib/supabase.ts` and `backend/src/config/env.ts` now defensively strip accidental `/rest/v1` and trailing slashes.
- **Expo Router Web SSR:** Web pre-rendering (`output: "static"`) runs in Node.js where `window` is undefined. Using `output: "single"` in `app.json` and wrapping `AsyncStorage` with an SSR-safe storage adapter prevents `ReferenceError: window is not defined`.
- **AI Provider Fallback:** The application includes a deterministic `MockAIProvider` so development and automated tests run seamlessly even without an external API key or network connectivity.
- **Expo Go Physical Device Connectivity:** When testing via Expo Go on a physical device, `localhost` refers to the phone itself, not the host machine. The mobile API client (`mobile/src/lib/api.ts`) auto-detects the dev machine's LAN IP from `Constants.expoConfig.hostUri` / `debuggerHost`. The backend binds to `0.0.0.0` instead of localhost to accept LAN connections.
- **Code runner worker path:** `codeRunnerWorker.cjs` lives at the backend package root so `../../codeRunnerWorker.cjs` resolves identically from `src/services` during dev and `dist/services` after compilation. Keep it at that path and include it in Docker images.
- **Optional migrations and persistence:** migrations 003–005 may be absent on a live project. Attempts, revision state/logs, and misconceptions then persist to a single-process JSON store at `LOCAL_STORE_PATH` (default `backend/data/local-store.json`). Applying migrations later does not auto-import that data.
- **Mobile/backend response contracts:** run/submit/hint responses are adapted server-side to include both canonical and mobile-friendly aliases. When changing either side, re-check `mobile/src/lib/api.ts` and `backend/src/routes/problems.ts`.
- **Web Speech availability:** `SpeechRecognition` is not available on native React Native. The voice modal detects support, shows a keyboard-dictation/text fallback on native, and surfaces permission/network errors inline.
- **Rate limiting is in-memory:** limits reset on restart and are per process. Multi-instance deployments need a shared store.
- **Proxy-aware rate limiting:** `TRUST_PROXY=true` is opt-in and only safe behind exactly one reverse proxy. Enabling it while directly exposed lets clients spoof `X-Forwarded-For`.
- **Deterministic persistence tests:** suites that exercise the local store set `LOCAL_STORE_PATH` to a unique OS temp file before dynamically importing services. This avoids inheriting previously rescheduled revision items or attempts from local dev data.
- **Auth placement:** `authenticate` and expensive-operation limiters are mounted in `backend/src/index.ts` before protected routers; direct-router tests deliberately omit auth, so security assertions live in `test_api_security.ts` instead.
- **Database-preferred content needs complete seeding:** services return Supabase rows whenever any exist, so a partial bootstrap seed (e.g., 3 migration problems) masks the larger canonical fallback. `npm run seed:curriculum` must seed patterns and problems as well as curriculum concepts, and verify all three counts.
- **Expo Router index routes:** link to directory routes as `/problems` and `/revision`, never `/problems/index` or `/revision/index`. The latter can capture a dynamic `[id]` route with `id="index"` or produce "Unmatched Route". Literal route pushes are typed so `tsc` catches invalid paths.

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

### Resolved: Mobile connectivity (Failed to connect to localhost/127.0.0.1:3000)
- **Problem:** `java.net.ConnectException: Failed to connect to localhost/127.0.0.1:3000` when testing on physical device via Expo Go.
- **Cause:** `localhost` on a phone refers to the phone itself, not the host machine running the backend.
- **Permanent solution:** Auto-detect dev machine LAN IP via `expo-constants` `debuggerHost` in `api.ts`; backend listens on `0.0.0.0`.
- **Status:** Resolved.

### Resolved: Dashboard displayed hardcoded progress
- **Problem:** Dashboard metrics were fabricated rather than derived from learner data.
- **Permanent solution:** `ProgressService` aggregates knowledge, sessions, attempts, revision, streaks, and misconceptions; dashboard consumes `GET /api/progress/summary`.
- **Status:** Resolved.

### Resolved: Attempts and revision progress lost without optional migrations
- **Problem:** When tables from migrations 003–005 were absent, submissions and review state were discarded.
- **Permanent solution:** Durable atomic JSON fallback (`LOCAL_STORE_PATH`) with Supabase preferred when available.
- **Status:** Resolved (single-process limitation documented).

### Resolved: Code runner could be held open by runaway submissions
- **Problem:** In-process VM timeouts did not bound the entire execution or memory use.
- **Permanent solution:** Separate heap-capped worker with per-test VM timeout and parent hard-kill; non-JavaScript rejected.
- **Status:** Resolved.

---

# 14. Handoff Notes

### Last completed task

Phase 11 (Production Hardening, Real Progress & Deployment):
- Unified canonical curriculum and idempotent live seeding (3/12/17/40/30).
- Real progress aggregation API and mobile dashboard wiring.
- Durable local fallback for attempts and revision persistence.
- Isolated child-process code execution with timeouts and JavaScript-only enforcement.
- Auth, CORS allowlist, security headers, rate limiting (`TRUST_PROXY` opt-in), body caps, and sanitized errors.
- Voice UX fixes and mobile/backend contract alignment.
- Three new suites; 159 assertions passing across nine suites.
- CI workflow, backend Docker image, EAS profiles, and deployment documentation.

### Current task

Documentation reconciliation and final verification are complete. Awaiting deployment and authenticated end-to-end smoke testing.

### Immediate next step

Deploy per [`DEPLOYMENT.md`](DEPLOYMENT.md), then verify authenticated workflows in a browser and on a physical device. No test account was available during this session.

### Current blocker

None. Docker and EAS CLIs were unavailable locally, so the Docker image and EAS builds have not been executed in this environment.

### Important implementation details

- **Free-First AI Engine (DEC-006):** When `GEMINI_API_KEY` is present in `backend/.env`, the system uses `gemini-3.6-flash` with structured JSON output. Without it, the deterministic `MockAIProvider` is used.
- **JavaScript Worker Sandbox (DEC-DEF-01):** Code runs in a separate, heap-capped child process behind a `vm` context. Each test has a VM timeout and the parent hard-kills the worker if it overstays. Only JavaScript is accepted.
- **Client-Side Speech API (DEC-DEF-02):** Speech recognition is client-side and web-only, with an editable transcript; native devices use keyboard dictation/text entry. No audio is stored.
- **SM-2 Spaced Repetition (DEC-DEF-03):** Calculates interval progression based on recall accuracy and confidence calibration.
- **Durable fallback store (DEC-DEF-04):** Attempts/revision/misconceptions persist to JSON when optional tables are absent; Supabase is preferred when those tables exist.