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

# 16. Problem Attempts

Potential fields:

- user_id
- problem_id
- status
- hints_used
- attempts
- solved_independently
- created_at

---

# 17. Revision Items

Potential fields:

- user_id
- concept_id
- due_at
- last_result

The `interval` and `difficulty` fields are intentionally omitted until a spaced-repetition algorithm is selected. See `DECISIONS.md` DEC-DEF-03.

---

# 18. AI Conversations

Only store information necessary for product functionality and debugging.

Do not store unnecessary sensitive information.

---

# 19. Schema Rule

Do not add database fields merely because they might be useful someday.

Add fields when an actual feature requires them.