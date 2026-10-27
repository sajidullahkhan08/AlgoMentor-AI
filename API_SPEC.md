# API SPECIFICATION

This file records the application's backend API contract across all implemented phases.

Base URL: `http://localhost:3000/api`

---

# Health & System

```text
GET /api/health
```
Response: `{ status: 'ok', service: 'algomentor-backend', timestamp: ISOString }`

---

# Authentication & Profiles

Supabase JWT validated via `Authorization: Bearer <token>` on all protected routes. Missing/invalid tokens return HTTP 401; there is no guest bypass.

```text
GET /api/profiles/me
PUT /api/profiles/me
```

`PUT` accepts `display_name`, `experience_level`, and `preferred_language`.

---

# Courses & Curriculum

```text
GET /api/courses
GET /api/courses/:id
GET /api/courses/:courseId/modules/:moduleId/topics
```
Returns course tree with populated modules, topics, concepts, and learning objectives. Canonical seed data is used as a fallback when the database is unavailable.

---

# Concepts & Prerequisites

```text
GET /api/concepts/topic/:topicId
GET /api/concepts/:id
GET /api/concepts/:id/prerequisites
```

Public routes. Unknown concepts return HTTP 404.

---

# AI Socratic Tutor

All routes require authentication and are rate-limited (20/min for AI-heavy operations, 60/min for hints).

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

- `GET /api/problems`: Filterable by `difficulty`, `category`, or `patternId`. Each problem includes its associated `patterns` array (joined from `pattern_id`) so clients can show tags and filter by pattern.
- `GET /api/problems`, `/patterns`, and `/:id` are public; detail responses also include `patterns`.
- `POST /api/problems/:id/run`: Executes JavaScript against visible test cases in an isolated child process (per-test VM timeout, parent hard-kill, 128 MB heap cap). Supports `javascript` / `js` only; other languages return HTTP 400. Requires auth; limited to 20 executions/minute.
- `POST /api/problems/:id/submit`: Executes against the full test suite and invokes the Socratic AI Reviewer for asymptotic analysis and edge cases. Requires auth; code-execution + AI limits apply.
- `POST /api/problems/:id/hint`: 3-tier problem hint ladder (Pattern Recognition → Invariant Formulation → Boundary/Optimization). Requires auth; practice limit applies.
- Run responses include canonical fields plus mobile-friendly aliases (`results`, `passedCount`, `totalCount`, `allPassed`); submit adds `runResult` and a flattened `review` summary.

---

# Learner Progress

All routes require authentication.

```text
GET /api/progress/summary
GET /api/progress/concepts/:conceptId
```

- `GET /api/progress/summary`: Aggregates knowledge state, active-session resume/recommendations, weak topics, recent activity, per-course progress, revision stats, misconceptions, and overview metrics (concepts mastered, problems attempted/solved, patterns, due reviews, retention, streak).
- `GET /api/progress/concepts/:conceptId`: Per-concept mastery/evidence, sessions, prerequisite status, and recommendation (`start` | `practice` | `advance` | `review`). Unknown concepts return HTTP 404.

---

# Revision & Spaced Repetition (SuperMemo SM-2)

All routes require authentication.

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

- `GET /api/system-design/scenarios`: Returns production-scale scenarios (Distributed URL Shortener, Real-Time Chat, Distributed Rate Limiter) with scale metrics. Public.
- `GET /api/system-design/scenarios/:id`: Detailed scenario specification, functional/non-functional requirements, and back-of-the-envelope calculations. Public.
- `POST /api/system-design/evaluate`: Socratic architectural consultant evaluating component topology, trade-offs, bottlenecks, and scalability. Requires auth; AI rate limit applies.

---

# API Principles

- Strict zod input validation and length limits on request bodies.
- Mandatory Supabase JWT authentication on learner data and expensive operations; no guest bypass.
- Free-first local execution (no metered paid API dependencies).
- Unified JSON error envelopes `{ error: string }` with appropriate status codes (400/401/404/413/429/500).
- Deterministic fallback when external AI services are unavailable (mock provider).
- Internal prompts, stack traces, provider errors, and database details are never returned.
- Fixed-window rate limits: global 300/min per IP; code execution 20/min; AI 20/min; practice writes/hints 60/min. 429 responses include `Retry-After`.
- Security headers, CORS allowlist (`CORS_ORIGINS`), and a 128 KB JSON body cap.