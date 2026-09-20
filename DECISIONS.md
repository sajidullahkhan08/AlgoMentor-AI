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

Date: 2026-09-20

Status: **Accepted**

Decision:

**SQL migration files (`002_seed_data.sql`)** with relational INSERT statements.

Reason:

- Version-controlled in the repository.
- Reproducible across any developer or agent environment with standard Supabase migrations.
- Establishes referential integrity across the concept graph.

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

Date: 2026-09-19

Status: Deferred (until Phase 5 — Problem Solving)

Question:

How will student code be executed and tested?

Candidates:

- Client-side WASM sandbox (e.g., Pyodide, wasm-based interpreters)
- Third-party execution service (e.g., Judge0)
- Server-side sandboxed container
- AI-based evaluation without actual execution

See `SECURITY.md` §7 for security constraints.

---

# DEC-DEF-02 — Voice / Speech-to-Text Provider

Date: 2026-09-19

Status: Deferred (until Phase 7 — Voice)

Question:

Which speech-to-text service to use for voice input?

Candidates:

- Device-native STT APIs (free, privacy-friendly, variable quality)
- Google Cloud Speech-to-Text (accurate, not free at scale)
- OpenAI Whisper (open-source, can run locally)
- Gemini multimodal audio input (if supported)

Constraints:

- Must respect the free-first constraint (DEC-006).
- Must address privacy implications of recording student audio.

---

# DEC-DEF-03 — Spaced Repetition Algorithm

Date: 2026-09-19

Status: Deferred (until Phase 8 — Revision)

Question:

Which algorithm to use for the revision/spaced-repetition system?

Candidates:

- SM-2 (simple, well-understood)
- FSRS (modern, more accurate)
- Custom interval logic
- No formal algorithm (manual review queue based on weakness detection)

Note:

The `DATABASE_SPEC.md` Revision Items table intentionally omits `interval` and `difficulty` fields until this decision is made.