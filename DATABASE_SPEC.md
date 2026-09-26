# DATABASE SPECIFICATION

This document defines the planned persistent data model.

The exact schema may evolve during implementation.

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

- id
- name
- description
- difficulty

---

# 9. Problems

Potential fields:

- id
- title
- description
- difficulty
- category
- constraints
- examples

---

# 10. Problem Concepts

Many-to-many relation between problems and concepts.

---

# 11. Problem Patterns

Many-to-many relation between problems and patterns.

---

# 12. Learning Sessions

Potential fields:

- id
- user_id
- concept_id
- started_at
- completed_at
- session_type

---

# 13. Interactions

Potential fields:

- session_id
- interaction_type
- question
- expected_evidence
- student_response
- evaluation
- created_at

---

# 14. Student Knowledge

Potential fields:

- user_id
- concept_id
- mastery_state
- confidence
- evidence_score
- last_assessed
- next_review

---

# 15. Student Pattern Knowledge

Potential fields:

- user_id
- pattern_id
- mastery_state
- confidence
- last_assessed

See `KNOWLEDGE_MODEL.md` §7 for pattern competency details.

---

---

# 16. Problem Attempts & Submissions

Implemented in migration `003_problems_and_patterns.sql`:

`user_problem_submissions`:
- `id` (UUID, PK)
- `user_id` (UUID, FK to `profiles.id`)
- `problem_id` (UUID, FK to `problems.id`)
- `code` (TEXT)
- `status` (`passed` | `failed` | `syntax_error` | `timeout`)
- `tests_passed` (INT)
- `total_tests` (INT)
- `runtime_ms` (INT)
- `ai_review` (JSONB)
- `hints_used` (INT)
- `created_at` (TIMESTAMPTZ)

---

# 17. Revision Items & Logs (SuperMemo SM-2)

Implemented in migration `004_revision_system.sql` (resolving DEC-DEF-03):

`revision_items`:
- `id` (UUID, PK)
- `user_id` (UUID, FK to `profiles.id`)
- `concept_id` (UUID, FK to `concepts.id`)
- `prompt_question` (TEXT)
- `expected_answer` (TEXT)
- `repetition_count` (INT, default 0)
- `interval_days` (NUMERIC, default 1.0)
- `ease_factor` (NUMERIC, default 2.5)
- `leitner_box` (INT, range [1, 5], default 1)
- `last_reviewed_at` (TIMESTAMPTZ)
- `next_review_due` (TIMESTAMPTZ)
- `last_rating` (INT, range [0, 5])
- `created_at` (TIMESTAMPTZ)

`revision_logs`:
- `id` (UUID, PK)
- `revision_item_id` (UUID, FK to `revision_items.id`)
- `user_id` (UUID, FK to `profiles.id`)
- `rating` (INT, range [0, 5])
- `student_answer` (TEXT)
- `interval_before` (NUMERIC)
- `interval_after` (NUMERIC)
- `ease_factor_before` (NUMERIC)
- `ease_factor_after` (NUMERIC)
- `reviewed_at` (TIMESTAMPTZ)

---

# 18. System Design Learning Track

Implemented in migration `005_system_design.sql`:

`system_design_scenarios`:
- `id` (TEXT, PK, e.g. `url-shortener`, `chat-system`, `rate-limiter`)
- `title` (TEXT)
- `difficulty` (`Beginner` | `Intermediate` | `Advanced`)
- `scale_metrics` (JSONB: DAU, write_qps, read_qps, storage_per_year, latency_target)
- `requirements` (JSONB: functional, non_functional)
- `calculations` (JSONB: storage, throughput, bandwidth)
- `created_at` (TIMESTAMPTZ)

`system_design_evaluations`:
- `id` (UUID, PK)
- `scenario_id` (TEXT, FK to `system_design_scenarios.id`)
- `user_id` (UUID, FK to `profiles.id`)
- `components` (JSONB: array of architectural blocks)
- `connections` (JSONB: directed graph edges between components)
- `evaluation` (JSONB: score, feedback, bottlenecks, trade_offs, socratic_prompt)
- `created_at` (TIMESTAMPTZ)

---

# 19. Schema Rule

Do not add database fields merely because they might be useful someday.

All fields documented here are backed by active migrations in `backend/supabase/migrations/` and verified with automated test suites.