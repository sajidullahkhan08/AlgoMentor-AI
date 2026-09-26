# KNOWLEDGE MODEL

# 1. Purpose

This document describes how the application represents Computer Science knowledge and student understanding.

---

# 2. Knowledge Hierarchy

The full conceptual hierarchy is:

```text
Domain
 ↓
Course
 ↓
Module
 ↓
Topic
 ↓
Concept
 ↓
Sub-concept
 ↓
Skill
 ↓
Problem
```

### MVP implementation levels

The initial database schema implements: **Course → Module → Topic → Concept**.

Sub-concept and Skill are not modeled as separate database entities in the MVP. They can be represented as Concepts with prerequisite relationships. The Domain level is implicit (the first domain is DSA).

See `DATABASE_SPEC.md` for the relational schema.

Example:

```text
DSA (domain, implicit)
 ↓
Searching (module or topic)
 ↓
Binary Search (concept)
 ↓
Search Space Reduction (concept, prerequisite of Binary Search)
 ↓
Eliminating Half (concept, prerequisite of Search Space Reduction)
 ↓
Binary Search Problem (problem, linked to Binary Search concept)
```

---

# 3. Concept Relationships

Concepts may have:

- prerequisite-of
- depends-on
- related-to
- example-of
- pattern-of
- applied-by
- contrasts-with

---

# 4. Student Knowledge State

Each student can have a state for each concept (and separately for each pattern).

Canonical mastery states (enum values):

```text
UNKNOWN        → display: "Not introduced"
INTRODUCED     → display: "Introduced"
LEARNING       → display: "Learning"
DEVELOPING     → display: "Developing"
PROFICIENT     → display: "Proficient"
MASTERED       → display: "Mastered"
```

The left column is the canonical enum value used in code and database. The right column is the user-facing display label.

These labels are conceptual and may be supplemented by numerical models later.

---

# 5. Evidence

Student state should be influenced by:

- Correct responses
- Incorrect responses
- Explanation quality
- Application
- Problem solving
- Hint usage
- Repeated performance
- Time
- Confidence
- Revision performance

---

# 6. Confidence

Confidence should be stored separately from knowledge.

Conceptually:

```text
Knowledge = estimated actual understanding

Confidence = student's belief about understanding
```

This allows the system to identify mismatches.

---

# 7. Pattern Knowledge

Patterns should have separate competency states.

Example:

```text
Sliding Window
├── Recognition
├── Fixed window
├── Variable window
├── Implementation
└── Problem transfer
```

---

# 8. Problem Knowledge

For each problem, track:

- Attempted
- Solved
- Solved independently
- Hints used
- Failed
- Pattern identified
- Time
- Number of attempts
- Explanation quality

---

# 9. Knowledge Graph

The first implementation uses relational database tables (see `DATABASE_SPEC.md` §7 Concept Relationships) rather than a dedicated graph database.

A graph database should only be introduced if the actual requirements justify it.

---

# 10. Spaced Repetition & Retention (Implemented)

Implemented in Phase 8 (resolving DEC-DEF-03):

- **SuperMemo SM-2 Algorithm**: Dynamically computes intervals and Ease Factor ($EF \ge 1.3$) based on active retrieval performance rating $q \in [0, 5]$.
- **5-Box Leitner Categorization**: Items progress from Box 1 (daily review) to Box 5 (long-term mastery).
- **Confidence Calibration Penalty**: Overconfident errors (high confidence + failed recall) trigger an immediate reset to Box 1 and Ease Factor reduction, while underconfident accurate answers accelerate interval growth.
- **Persistent Logs**: Every review is recorded in `revision_logs` to enable historical retention analytics.