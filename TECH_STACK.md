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
- Migrations 001–005 applied (`001_foundation`, `002_seed_data`, `003_problems_and_patterns`, `004_revision_system`, `005_system_design`)

Status:

**Implemented** (`backend/supabase/migrations/`)

---

# 4. Authentication

- Supabase Auth (client-side SDK)
- Backend validates Supabase JWTs with `optionalAuthenticate` support for demo/studio contexts

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

- Server-side isolated Node.js `vm.createContext` execution engine (`backend/src/services/codeRunner.ts`)
- Sanitized global namespace (`process`, `require`, `fs`, `fetch`, etc. stripped)
- Strict 1,000ms wall-clock execution timeout per test case
- Socratic AI Code Reviewer for asymptotic analysis ($O(n)$ vs $O(\log n)$)

Decision: DEC-DEF-01 (Accepted)

Status:

**Implemented** (`backend/src/services/codeRunner.ts`)

---

# 7. Voice & Speech-to-Text Reasoning

- Client-side Speech Recognition via browser Web Speech API / native mobile dictation
- Interactive live transcript modal with technical jargon editing (`VoiceReasoningModal.tsx`)
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
  - `VisualBinaryTree.tsx`: BST traversal (In-Order, Pre-Order, Post-Order, Level-Order)
  - `VisualGraphTraversal.tsx`: BFS radial expansion & DFS backtracking
  - `VisualTwoPointerWindow.tsx`: Sliding window & two-pointer invariant tracking
  - `VisualDPMatrix.tsx`: Grid Paths & Knapsack table formulation
  - `VisualBigOComparator.tsx`: Asymptotic curve plotting & scale comparative analysis

Status:

**Implemented** (`mobile/src/components/visualizers/`)

---

# 10. Development Tools

In use:

- VS Code / Google Antigravity
- Git
- npm
- TypeScript compiler (`tsc`)

---

# 11. Important Principle

Strict adherence to **Free-First (DEC-006)** development:
No metered third-party STT or code execution APIs. All compute runs deterministically and safely locally or on generous free tiers.