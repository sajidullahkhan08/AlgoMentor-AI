# TECHNOLOGY STACK

This file records the actual technology stack.

The stack should prioritize:

1. Free availability
2. Stability
3. Developer productivity
4. Maintainability
5. Replaceability
6. Suitability for an academic project

---

# 1. Frontend

- React Native 0.86
- Expo SDK 57
- TypeScript 6
- Expo Router (file-based routing)

Status:

**Implemented** (`mobile/`)

---

# 2. Backend

- Node.js
- TypeScript
- Express 5

Decision: DEC-PEN-01 (Accepted)

Status:

**Implemented** (`backend/`)

---

# 3. Database

- PostgreSQL (via Supabase)
- Supabase client library (backend: service role; mobile: anon key)
- Migrations 001, 003, 004, 005 (`001_foundation`, `003_problems_and_patterns`, `004_revision_system`, `005_system_design`); `002_seed_data` is a legacy bootstrap seed
- Canonical curriculum seeder: `npm run seed:curriculum` (idempotent upserts; 3 courses / 12 modules / 17 topics / 40 concepts / 30 relationships, plus 15 patterns / 30 problems)
- Durable JSON fallback for attempts/revision/misconceptions when optional tables are absent (`backend/data/local-store.json`, atomic writes)

Status:

**Implemented** (`backend/supabase/migrations/`)

---

# 4. Authentication

- Supabase Auth (client-side SDK)
- Backend validates Supabase JWTs with mandatory `authenticate` middleware on all learner data and expensive operations

Decision: DEC-PEN-02 (Accepted), DEC-PEN-03 (Accepted)

Status:

**Implemented** — auth context (mobile) + JWT middleware (backend)

---

# 5. AI Layer

Primary provider:

- Gemini API (`@google/genai`, `gemini-3.6-flash`) with structured schema enforcement

Fallback strategy:

- Deterministic `MockAIProvider` with 0% downtime and instant offline capabilities
- Resilient factory pattern (`backend/src/services/ai/index.ts`)

Decision: DEC-PEN-06 (Accepted)

Status:

**Implemented** (`backend/src/services/ai/`)

---

# 6. Sandboxed Code Execution

- Isolated child-process worker (`backend/codeRunnerWorker.cjs`) behind `backend/src/services/codeRunner.ts`
- `vm` context with dynamic code generation disabled; `process`, `require`, `module`, `fs`, `fetch`, etc. unavailable
- Per-test VM timeout (default 1,000 ms, clamp 100–5,000 ms), parent hard-kill (max 30 s), 128 MB heap cap, capped output
- JavaScript/TypeScript-style JavaScript only; other languages rejected with HTTP 400
- Socratic AI Code Reviewer for asymptotic analysis ($O(n)$ vs $O(\log n)$)

Decision: DEC-DEF-01 (Accepted)

Status:

**Implemented** (`backend/src/services/codeRunner.ts`)

---

# 7. Voice & Speech-to-Text Reasoning

- Web Speech API recognition in browsers, with an editable live transcript (`VoiceReasoningModal.tsx`)
- Native builds show a keyboard-dictation/text-entry fallback because `SpeechRecognition` is web-only
- Inline permission/network/submission error states; no audio recordings stored
- Server-side verbal reasoning analysis (`evaluateSpokenReasoning`)

Decision: DEC-DEF-02 (Accepted)

Status:

**Implemented** (`mobile/src/components/VoiceReasoningModal.tsx`, `backend/src/routes/tutor.ts`)

---

# 8. Spaced Repetition Engine

- SuperMemo SM-2 algorithm enhanced with confidence calibration and 5-box Leitner categorization
- Mathematical computation of Ease Factor ($EF \ge 1.3$), interval expansion, and review logs

Decision: DEC-DEF-03 (Accepted)

Status:

**Implemented** (`backend/src/services/revisionService.ts`, `backend/src/routes/revision.ts`)

---

# 9. Interactive Mental Models & Visualizations

- Custom React Native animated components:
  - `VisualTreeTraversal.tsx`: BST traversal (In-Order, Pre-Order, Post-Order, Level-Order)
  - `VisualGraphTraversal.tsx`: BFS radial expansion & DFS backtracking
  - `VisualTwoPointerSlidingWindow.tsx`: Sliding window & two-pointer invariant tracking
  - `VisualDPMatrix.tsx`: Grid Paths & Knapsack table formulation
  - `VisualComplexityComparator.tsx`: Asymptotic curve plotting & scale comparative analysis
  - `VisualArrayTrace.tsx`: Step-by-step array/pointer invariant trace

Status:

**Implemented** (`mobile/src/components/`)

---

# 10. API Hardening

- Mandatory Supabase JWT auth and per-user/IP fixed-window rate limits (`backend/src/middleware/rateLimit.ts`)
- CORS allowlist (`CORS_ORIGINS`), security headers, HSTS in production, disabled `x-powered-by`
- 128 KB strict JSON body cap; zod request validation; sanitized error handler
- 413/400/401/404/429/500 responses without internal details

---

# 11. Testing, CI & Deployment

- Backend tests: `tsx` running nine suites (159 assertions) via `npm test`; TypeScript via `npm run typecheck`
- Mobile: TypeScript 6 (`npm run typecheck`) and Expo web export
- CI: GitHub Actions (`.github/workflows/ci.yml`)
- Backend packaging: multi-stage Docker image (`backend/Dockerfile`) with healthcheck and persistent `/app/data` volume
- Mobile packaging: EAS Build profiles (`mobile/eas.json`)
- Deployment guide: [`DEPLOYMENT.md`](DEPLOYMENT.md)

---

# 12. Development Tools

In use:

- VS Code / Google Antigravity
- Git
- npm
- TypeScript compiler (`tsc`), `tsx`
- GitHub Actions, Docker, EAS CLI

---

# 13. Important Principle

Strict adherence to **Free-First (DEC-006)** development:
No metered third-party STT or code execution APIs. All compute runs deterministically and safely locally or on generous free tiers.