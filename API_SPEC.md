# API SPECIFICATION

This file records the application's backend API contract across all implemented phases.

Base URL: `http://localhost:3000/api`

---

# Health & System

```text
GET /api/health
```
Response: `{ status: 'ok', timestamp: ISOString, uptime: number }`

---

# Authentication & Profiles

Supabase JWT Bearer token validated via `Authorization: Bearer <token>`.

```text
GET /api/profile
PUT /api/profile
```

---

# Courses & Curriculum

```text
GET /api/courses
GET /api/courses/:id
```
Returns course tree with populated modules, topics, concepts, and learning objectives.

---

# Concepts & Prerequisites

```text
GET /api/concepts/:id
GET /api/concepts/:id/prerequisites
```

---

# AI Socratic Tutor

```text
POST /api/tutor/session
POST /api/tutor/session/:id/respond
POST /api/tutor/session/:id/hint
GET  /api/tutor/session/:id
POST /api/tutor/voice/evaluate
```

- `POST /api/tutor/session`: Initiates or resumes a tutor session for a `conceptId`.
- `POST /api/tutor/session/:id/respond`: Submits student choice / order / explanation + confidence level (`low` | `medium` | `high`). Returns Socratic evaluation, mastery delta, calibration note, and next interaction.
- `POST /api/tutor/session/:id/hint`: Escalates hint ladder (Levels 1–7).
- `POST /api/tutor/voice/evaluate`: Socratic spoken reasoning review evaluating spoken transcript for conceptual accuracy, clarity, edge-cases, and communication delivery tips.

---

# Problem Solving & Sandboxed Execution

```text
GET  /api/problems
GET  /api/problems/patterns
GET  /api/problems/:id
POST /api/problems/:id/run
POST /api/problems/:id/submit
POST /api/problems/:id/hint
```

- `GET /api/problems`: Filterable by `difficulty`, `patternId`, or `conceptId`.
- `POST /api/problems/:id/run`: Executes code against visible test cases in isolated Node.js VM context (1,000ms wall-clock timeout).
- `POST /api/problems/:id/submit`: Executes against full hidden test suite + invokes Socratic AI Reviewer for asymptotic analysis.
- `POST /api/problems/:id/hint`: Progressive problem hint ladder (Conceptual → Pattern → Complexity → Edge-case).

---

# Revision & Spaced Repetition (SuperMemo SM-2)

```text
GET  /api/revision/queue
POST /api/revision/review
GET  /api/revision/stats
```

- `GET /api/revision/queue`: Returns items due for review ordered by urgency, categorized into Leitner Boxes 1–5.
- `POST /api/revision/review`: Submits active retrieval self-rating ($q \in [0, 5]$) + confidence. Computes new interval, Ease Factor, repetition count, and box transition.
- `GET /api/revision/stats`: Returns overall retention rate, box distribution counts, review streak, and next due timestamp.

---

# System Design Learning Track

```text
GET  /api/system-design/scenarios
GET  /api/system-design/scenarios/:id
POST /api/system-design/evaluate
```

- `GET /api/system-design/scenarios`: Returns production-scale scenarios (Distributed URL Shortener, Real-Time Chat, Distributed Rate Limiter) with scale metrics.
- `GET /api/system-design/scenarios/:id`: Detailed scenario specification, functional/non-functional requirements, and back-of-the-envelope calculations.
- `POST /api/system-design/evaluate`: Socratic architectural consultant evaluating component topology (Load Balancers, Services, Caches, Sharded DBs), trade-offs (CAP theorem, cache invalidation), bottlenecks, and scalability.

---

# API Principles

- Strict input validation on all request bodies.
- Safe authorization via Supabase JWT Bearer tokens with optional bypass for test/studio contexts.
- Free-first local execution (no metered paid API dependencies).
- Unified JSON error envelopes `{ error: string, code?: string }`.
- Deterministic fallback when external AI services are unavailable or rate-limited.
- Avoid exposing raw internal AI prompts.
- Rate-limit expensive AI operations.