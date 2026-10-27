# DATABASE SPECIFICATION

This document describes the implemented persistent data model and its local fallback.

Migrations: `001_foundation.sql`, `003_problems_and_patterns.sql`, `004_revision_system.sql`, `005_system_design.sql`. `002_seed_data.sql` is a legacy bootstrap seed and is not used by the canonical seeder (`npm run seed:curriculum`).

---

# 1. Users

Potential fields:

- id
- email
- name
- created_at
- updated_at

---

# 2. Profiles

Potential fields:

- user_id
- display_name
- experience_level
- preferred_language
- learning_preferences

---

# 3. Courses

- id
- title
- description
- difficulty

---

# 4. Modules

- id
- course_id
- title
- order

---

# 5. Topics

- id
- module_id
- title
- description
- order

---

# 6. Concepts

- id
- topic_id
- name
- description
- difficulty
- learning_objectives

---

# 7. Concept Relationships

- source_concept_id
- target_concept_id
- relationship_type

Possible relationship types:

- prerequisite
- related
- applied_by
- pattern
- contrast

---

# 8. Patterns

Implemented in `003_problems_and_patterns.sql`:

- id
- name
- description
- difficulty (`beginner` | `intermediate` | `advanced`)
- recognition_signals (JSONB)
- common_mistakes (JSONB)
- sort_order
- created_at

---

# 9. Problems

Implemented in `003_problems_and_patterns.sql`:

- id
- title
- description
- difficulty (`easy` | `medium` | `hard`)
- category
- pattern_id (FK to `patterns`, nullable)
- constraints (JSONB)
- examples (JSONB)
- starter_code (JSONB)
- test_cases (JSONB)
- sort_order
- created_at

---

# 10. Problem Concepts

Many-to-many relation between problems and concepts (`problem_concepts`).

---

# 11. Problem Patterns

Each problem has one optional `pattern_id` (many-to-one). There is no separate `problem_patterns` join table.

---

# 12. Learning Sessions

Implemented in `001_foundation.sql`:

- id
- user_id (FK to `auth.users`)
- concept_id (FK to `concepts`)
- session_type (`tutoring` | `practice` | `revision` | `assessment`)
- status (`active` | `completed` | `abandoned`)
- started_at
- completed_at

---

# 13. Interactions

Implemented in `001_foundation.sql`:

- id
- session_id (FK to `learning_sessions`)
- interaction_type
- question (JSONB)
- expected_evidence (JSONB)
- student_response (JSONB)
- evaluation (JSONB)
- hint_level
- sort_order
- created_at

---

# 14. Student Knowledge

Implemented in `001_foundation.sql`:

- id
- user_id (FK to `auth.users`)
- concept_id
- mastery_state (`UNKNOWN` | `INTRODUCED` | `LEARNING` | `DEVELOPING` | `PROFICIENT` | `MASTERED`)
- confidence
- evidence_score
- last_assessed
- next_review
- created_at / updated_at
- UNIQUE(user_id, concept_id)

---

# 15. Student Pattern Knowledge

Not yet implemented as a table. Pattern-level mastery is currently derived from problem attempts and concept knowledge described in `KNOWLEDGE_MODEL.md` §7.

---

# 16. Problem Attempts & Misconceptions

Implemented in migration `003_problems_and_patterns.sql`:

`problem_attempts`:
- `id` (UUID, PK)
- `user_id` (UUID, FK to `auth.users`)
- `problem_id` (UUID, FK to `problems`)
- `code` (TEXT)
- `language` (TEXT, default `javascript`)
- `status` (`attempted` | `passed` | `failed` | `solved_independently`)
- `test_results` (JSONB)
- `ai_feedback` (JSONB)
- `hints_used` (INT)
- `created_at` (TIMESTAMPTZ)

`student_misconceptions`:
- `id` (UUID, PK)
- `user_id` (UUID, FK to `auth.users`)
- `concept_id` (UUID, nullable FK)
- `misconception_tag` (TEXT)
- `description` (TEXT)
- `occurrence_count` (INT, default 1)
- `last_detected_at` (TIMESTAMPTZ)
- `resolved` (BOOLEAN, default false)
- UNIQUE(user_id, misconception_tag, concept_id)

RLS is enabled; users can only manage their own attempts and misconceptions, while patterns/problems/`problem_concepts` are publicly readable.

---

# 17. Revision Items & Logs (SuperMemo SM-2)

Implemented in migration `004_revision_system.sql` (resolving DEC-DEF-03):

`revision_items`:
- `id` (UUID, PK)
- `user_id` (UUID)
- `concept_id` (nullable FK to `concepts`)
- `problem_id` (nullable FK to `problems`)
- `item_type` (`concept` | `problem` | `invariant`)
- `title` (TEXT)
- `prompt_question` (TEXT)
- `solution_explanation` (TEXT)
- `key_invariant` (TEXT)
- `repetition_count` (INT, default 0)
- `interval_days` (INT, default 1)
- `easiness_factor` (FLOAT, default 2.5)
- `leitner_box` (INT, range [1, 5], default 1)
- `next_review_date` (TIMESTAMPTZ)
- `last_reviewed_at` (TIMESTAMPTZ)
- `weakness_flags` (JSONB)
- `created_at` / `updated_at`

`revision_logs`:
- `id` (UUID, PK)
- `revision_item_id` (UUID, FK)
- `user_id` (UUID)
- `rating` (INT, range [0, 5])
- `previous_interval` / `new_interval` (INT)
- `previous_ef` / `new_ef` (FLOAT)
- `confidence` (TEXT)
- `time_spent_seconds` (INT)
- `reviewed_at` (TIMESTAMPTZ)

---

# 18. System Design Learning Track

Implemented in migration `005_system_design.sql`:

`system_design_scenarios`:
- `id` (UUID, PK)
- `slug` (TEXT, unique — e.g. `url-shortener`, `chat-system`, `rate-limiter`)
- `title` (TEXT)
- `description` (TEXT)
- `difficulty` (`beginner` | `intermediate` | `advanced`)
- `category` (TEXT)
- `scale_metrics` (JSONB: DAU, QPS, storage, latency)
- `functional_requirements` (JSONB)
- `non_functional_requirements` (JSONB)
- `architecture_components` (JSONB)
- `trade_off_questions` (JSONB)
- `created_at` (TIMESTAMPTZ)

Architecture evaluations are computed by `systemDesignService` and returned to the client; they are not persisted in a separate table.

---

# 19. Durable Local Fallback

When migrations 003–005 are absent (or a Supabase call fails), the backend persists learner data to a single-process JSON file at `LOCAL_STORE_PATH` (default `backend/data/local-store.json`):

- `attempts`: normalized problem attempts (id, user_id, problem_id/title, language, status, passed/total, hints, issues, created_at)
- `revisionItems`: per-user revision items mirroring the SM-2 fields above
- `revisionLogs`: per-user review history
- `misconceptions`: per-user tag, description, last detection, occurrences

Writes are atomic (temp file + rename). The file is gitignored and must be on a persistent volume. It is not shared across instances, and its data is not automatically imported into Supabase if migrations are applied later.

---

# 20. Schema Rule

Do not add database fields merely because they might be useful someday.

Tables in sections 8–18 are backed by active migrations in `backend/supabase/migrations/`. The local fallback in §19 mirrors only the subset needed for graceful degradation.