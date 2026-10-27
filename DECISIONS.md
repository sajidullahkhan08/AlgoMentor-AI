# ARCHITECTURAL & PRODUCT DECISIONS

This file records important decisions and their reasoning.

Do not silently reverse a decision.

If a decision changes, add a new entry rather than deleting history.

---

# Decision Format

```text
## DEC-XXX — Title

Date:
Status: Accepted | Pending | Deferred | Superseded
Decision:

Context:

Reason:

Alternatives considered:

Consequences:
```

Status meanings:

- **Accepted** — Decision is final and should be followed.
- **Pending** — Decision is needed before implementation of its phase can begin. Candidates listed.
- **Deferred** — Decision is intentionally postponed until its phase starts.
- **Superseded** — Decision was replaced by a later decision.

---

# DEC-001 — Adaptive Socratic Tutor

Date: 2026-09-19

Status: Accepted

Decision:

The application will use an adaptive Socratic tutoring model rather than a conventional chatbot model.

Reason:

The primary goal is active understanding and independent problem solving.

---

# DEC-002 — Multiple Response Modes

Date: 2026-09-19

Status: Accepted

Decision:

Students can respond through multiple modalities including choices, ordering, text, code, visual interaction, and voice.

Reason:

Mobile typing creates unnecessary friction.

The system should make responding easy without reducing cognitive engagement.

---

# DEC-003 — Prerequisite Descent

Date: 2026-09-19

Status: Accepted

Decision:

The tutor should descend into prerequisite concepts when the learner demonstrates insufficient understanding.

Reason:

Many apparent advanced-topic problems are actually caused by missing foundational knowledge.

---

# DEC-004 — LLM Is Not the Tutor Engine

Date: 2026-09-19

Status: Accepted

Decision:

The LLM will operate as a component inside a structured Tutor Engine.

Reason:

Persistent learning state, curriculum, knowledge relationships, and application behavior should not depend entirely on an LLM.

---

# DEC-005 — Replaceable AI Provider

Date: 2026-09-19

Status: Accepted

Decision:

AI calls will use a provider abstraction.

Reason:

Free AI APIs and quotas can change.

The application should avoid unnecessary provider lock-in.

---

# DEC-006 — Free-First Development

Date: 2026-09-19

Status: Accepted

Decision:

The project will initially use free/open-source tools and free service tiers.

Reason:

The project is a student/FYP/course project and should not require ongoing paid infrastructure.

---

# DEC-007 — Small MVP First

Date: 2026-09-19

Status: Accepted

Decision:

The first implementation will focus on one strong end-to-end adaptive tutoring flow rather than implementing the entire feature list immediately.

Reason:

A working vertical slice provides better validation than a large incomplete system.

---

# Pending Decisions

These decisions must be resolved before their respective phases begin.

---

# DEC-PEN-01 — Backend Framework

Date: 2026-09-19

Status: **Accepted**

Decision:

**Express** with TypeScript.

Reason:

- Largest ecosystem and community — easiest to find solutions for an FYP project.
- Simplest learning curve.
- TypeScript support via `ts-node` / `tsx` is well-established.
- Compatible with Supabase client library and PostgreSQL drivers.
- No unnecessary complexity for an academic project.

Alternatives considered:

- Fastify — better built-in validation and performance, but smaller ecosystem and adds learning overhead.
- Hono — modern and lightweight, but less mature ecosystem and fewer resources.

Referenced in: `TECH_STACK.md` §2.

---

# DEC-PEN-02 — Authentication Approach

Date: 2026-09-19

Status: **Accepted**

Decision:

**Supabase Auth (client-side SDK)** — the React Native app calls Supabase Auth directly. The Express backend validates Supabase JWTs on protected routes.

Reason:

- Simplest approach — Supabase Auth handles registration, login, password reset, token refresh, and session persistence automatically.
- Free tier is sufficient for an FYP project.
- Removes the need for custom auth endpoints (`POST /auth/register`, `POST /auth/login`, `POST /auth/logout`).
- The backend only needs a JWT verification middleware, not full auth logic.

Consequences:

- The `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` endpoints in `API_SPEC.md` are **not needed**. The `GET /auth/me` endpoint may still be useful for profile data.
- API_SPEC.md should be updated to reflect this.
- The backend must verify the Supabase JWT on every protected route using the Supabase JWT secret.

---

# DEC-PEN-03 — Session and Token Strategy

Date: 2026-09-19

Status: **Accepted**

Decision:

**Supabase session tokens** — the Supabase Auth SDK manages JWTs and refresh tokens automatically on the client. The backend validates these JWTs.

Reason:

- Direct consequence of DEC-PEN-02.
- Supabase handles token refresh, session persistence, and expiry automatically.
- No custom JWT issuance or refresh logic needed.
- The Express backend uses Supabase's `getUser()` or JWT verification to authenticate requests.

---

# DEC-PEN-04 — Tutor Session Context Strategy

Date: 2026-09-20

Status: **Accepted**

Decision:

**Sliding window of last 3 interactions + structured state injection**.
Each prompt receives the current concept metadata (name, description, objectives), the current mastery level, and the student's last 3 interactions in the active session.

Reason:

- Stays strictly within free-tier token budgets.
- Prevents context explosion while providing sufficient context for Socratic continuity.
- Stores persistent state in the database, not in the prompt.

---

# DEC-PEN-05 — Curriculum Seed Data Format

Date: 2026-09-20 (amended 2026-10-24)

Status: **Accepted — amended**

Decision:

**Canonical TypeScript curriculum source + idempotent seeder** (`backend/src/data/curriculum.ts` → `npm run seed:curriculum`), superseding the original `002_seed_data.sql` INSERT migration for new deployments.

Reason:

- A single typed source of truth keeps courses, modules, topics, concepts, prerequisite edges, problems, and patterns consistent across the API services, seeds, and tests.
- Deterministic UUID upserts make seeding repeatable and safe to run on existing projects; the seeder verifies that all 40 concepts resolve afterward.
- `002_seed_data.sql` remains in the repository as a legacy bootstrap seed only.

---

# DEC-PEN-06 — AI Structured Output Strategy

Date: 2026-09-20

Status: **Accepted**

Decision:

**Combined approach: Provider-native schema enforcement + defensive parsing fallback**.
Use Gemini's native `responseMimeType: 'application/json'` and `responseSchema` via `@google/genai`, coupled with defensive error handling and a deterministic `MockAIProvider` fallback.

Reason:

- Native schema enforcement provides reliable structured JSON directly from the model.
- Defensive parsing ensures the backend never crashes if an unexpected response or timeout occurs.
- Compatible with the replaceable `AIProvider` interface.

---

# Deferred Decisions

These decisions are intentionally postponed. They should be resolved when their respective phase begins.

---

# DEC-DEF-01 — Code Execution Environment

Date: 2026-09-22 (amended 2026-10-24)

Status: **Accepted**

Decision:

**Server-side isolated child-process JavaScript sandbox with VM timeout enforcement.**

Reason:

- Preserves the strict **Free-First (DEC-006)** constraint — no paid third-party execution APIs.
- Isolation:
  - Untrusted code runs in a separate Node.js process (`codeRunnerWorker.cjs`), never in the Express process.
  - The worker uses `vm.createContext` with `codeGeneration: { strings: false, wasm: false }`; `process`, `require`, `module`, `fs`, `fetch`, `XMLHttpRequest`, `WebSocket`, `ChildProcess`, and `Buffer` are unavailable.
  - Per-test VM timeout (default 1,000 ms, clamped 100–5,000 ms); the parent enforces a hard wall-clock timeout (`tests × timeout + 3s`, max 30 s) and kills the worker.
  - The worker runs with `--max-old-space-size=128`, a minimal environment, and capped stdout/stderr/output.
  - Only JavaScript (`javascript` / `js`) is accepted; other languages are rejected before execution.
- Combined with **Socratic AI Code Reviewer** (`GeminiProvider` / `MockAIProvider`):
  - Sandboxed execution validates correctness against test suites.
  - The AI reviewer analyzes time/space complexity, boundary invariants, and generates reflection prompts without executing code.

Referenced in: `SECURITY.md` §7, `DEPLOYMENT.md`, `AI_TUTOR_ENGINE.md`, `TECH_STACK.md`.

---

# DEC-DEF-02 — Voice / Speech-to-Text Provider

Date: 2026-09-24

Status: **Accepted**

Decision:

**Hybrid Free-First Voice Reasoning Architecture (Client-Side Speech API + Socratic Spoken Analysis).**

Reason:

- Preserves the strict **Free-First (DEC-006)** constraint — eliminates third-party metered STT API costs.
- Architecture:
  - **Client-Side Speech Recognition**: Uses the browser Web Speech API on web with editable live transcription. Native builds show a keyboard-dictation/text-entry fallback because `SpeechRecognition` is not available in React Native.
  - **Editable Transcript Modal**: Enables students to preview and refine transcribed technical jargon (e.g. "deque", "$O(\log n)$", "BFS") before submission, and preserves typed text while recording.
  - **Socratic Spoken Reasoning Evaluation**: The backend AI provider analyzes verbal stream-of-consciousness explanations for conceptual clarity, edge-case consideration, and communication fluency.
  - **Privacy Guarantee**: Audio streams are processed locally and discarded immediately. No raw voice recordings are stored in the database.

Referenced in: `FEATURE_SPEC.md` §P2 Voice, `AI_TUTOR_ENGINE.md` §3.

---

# DEC-DEF-03 — Spaced Repetition Algorithm

Date: 2026-09-24

Status: **Accepted**

Decision:

**SuperMemo SM-2 Algorithm Enhanced with Confidence Calibration and 5-Box Leitner Categorization.**

Reason:

- **Proven & Predictable**: SM-2 has over three decades of empirical validation in cognitive psychology and computer-assisted learning (Anki, SuperMemo).
- **Free-First & Lightweight (DEC-006)**: Runs deterministically in both TypeScript backend and client without requiring external machine learning inference pipelines or paid scheduling APIs.
- **Formulation**:
  - Rating $q \in \{0, 1, 2, 3, 4, 5\}$ (0: Blackout, 2: Hard, 3: Good, 5: Perfect).
  - If $q < 3$ (Failed Retrieval):
    - `repetitions = 0`
    - `interval_days = 1`
    - If overconfident, penalty reset to Leitner Box 1 immediately.
  - If $q \ge 3$ (Successful Retrieval):
    - $I(0) = 1$, $I(1) = 6$, $I(n) = \text{round}(I(n-1) \times \text{EF})$.
    - $\text{EF}' = \max(1.3, \text{EF} + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)))$.
    - `leitner_box` $\in [1, 5]$ computed as $\min(5, \lfloor \text{repetitions} / 2 \rfloor + 1)$.
- **Calibration Integration**: Misconceptions and overconfidence triggers a steeper EF penalty, while high-confidence verified answers accelerate interval progression.

Referenced in: `FEATURE_SPEC.md` §P2 Revision, `DATABASE_SPEC.md` Revision Items, `KNOWLEDGE_MODEL.md`.

---

# DEC-DEF-04 — Durable Fallback for Optional Persistence Tables

Date: 2026-10-24

Status: **Accepted**

Decision:

**Persist attempts, revision items/logs, and misconceptions to an atomic local JSON store when migrations 003–005 are unavailable, while preferring Supabase whenever those tables exist.**

Reason:

- The live project may not have optional migrations applied; silently dropping learner attempts and revision progress is unacceptable.
- A single-process JSON file (temp write + rename) provides durable, dependency-free persistence without adding another service.
- Supabase remains the source of truth for multi-instance deployments; the fallback explicitly documents its single-process limitation.
- Applying migrations later does not auto-import fallback data, so deployments should apply all migrations up front.

Referenced in: `SECURITY.md` §12, `DATABASE_SPEC.md` §19, `DEPLOYMENT.md` §1 and §7, `PROJECT_MEMORY.md` §12.