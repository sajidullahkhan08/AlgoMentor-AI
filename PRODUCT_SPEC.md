# PRODUCT SPECIFICATION

This document is the **canonical source** for product scope, user definitions, curriculum content, and the product-level feature vision.

For implementation-level details, see:
- Tutor loop, interactions, and hints: `AI_TUTOR_ENGINE.md`
- Knowledge model and student state: `KNOWLEDGE_MODEL.md`
- System architecture: `ARCHITECTURE.md`

# 1. Product Overview

## Working Name

AlgoMentor AI

## Product Type

Adaptive AI learning platform for Computer Science.

## Primary Users

- University CS students
- Beginner programmers
- Students learning DSA
- Students preparing for coding interviews
- Students learning System Design
- Self-learners

---

# 2. Problem

Many educational systems primarily provide:

- Explanations
- Videos
- Articles
- Questions
- Solutions

The learner often consumes information without demonstrating genuine understanding.

Traditional AI tutors also tend to provide answers too quickly.

The product aims to solve this by making the AI act as an adaptive tutor that:

1. Determines what the student knows.
2. Identifies gaps.
3. Finds prerequisite concepts.
4. Teaches those prerequisites.
5. Tests understanding.
6. Builds back toward the original concept.
7. Applies the concept to problems.

---

# 3. Product Goal

The primary goal is:

> Help students develop independent Computer Science problem-solving ability rather than dependence on explanations or AI-generated solutions.

---

# 4. Core Learning Loop

```text
Learn
 ↓
Question
 ↓
Student reasoning
 ↓
Evaluation
 ↓
Diagnosis
 ↓
Targeted teaching
 ↓
Practice
 ↓
Independent application
 ↓
Revision
```

See `AI_TUTOR_ENGINE.md` §2 for the canonical implementation-level core loop.

---

# 5. Core Features

## 5.1 AI Socratic Tutor

The tutor conducts interactive learning sessions.

Responsibilities:

- Ask questions
- Explain concepts
- Diagnose gaps
- Ask follow-ups
- Give hints
- Adjust difficulty
- Detect misconceptions
- Test understanding
- Encourage independent reasoning

---

## 5.2 Adaptive Prerequisite Navigation

Every concept can have prerequisites.

Example:

```text
Dynamic Programming
        ↓
Recursion
        ↓
State
        ↓
Subproblems
        ↓
Memoization
```

If the learner struggles, the system moves downward.

---

## 5.3 Multiple Interaction Modes

The tutor may use:

- MCQ
- Multiple selection
- Ordering
- Matching
- Fill blanks
- Code completion
- Output prediction
- Visual tracing
- Drag-and-drop
- Voice
- Short text
- Free explanation
- Code submission

---

# 6. DSA Curriculum

## Programming Foundations

- Variables
- Conditions
- Loops
- Functions
- Arrays
- Strings
- Recursion
- Objects
- Complexity

## Data Structures

- Arrays
- Linked Lists
- Stacks
- Queues
- Hash Tables
- Trees
- BST
- Heaps
- Graphs
- Tries

## Algorithms

- Searching
- Sorting
- Binary Search
- BFS
- DFS
- Recursion
- Backtracking
- Greedy
- Divide & Conquer
- Dynamic Programming

---

# 7. Problem-Solving Patterns

The platform should teach pattern recognition.

Examples:

- Two Pointers
- Sliding Window
- Hashing
- Prefix Sum
- Binary Search
- Fast/Slow Pointers
- Stack
- Monotonic Stack
- BFS
- DFS
- Backtracking
- Greedy
- Heap / Top-K
- Intervals
- Union-Find
- Dynamic Programming

The goal is not merely:

> Know the pattern.

The goal is:

> Recognize when a pattern is appropriate and explain why.

---

# 8. Problem Practice

Each problem should ideally contain:

- Problem statement
- Constraints
- Examples
- Difficulty
- Relevant concepts
- Relevant patterns
- Prerequisites
- Hints
- Progressive assistance
- Code editor
- Test cases
- Evaluation
- Reflection

---

# 9. Progressive Hint System

The system should provide assistance progressively.

```text
No hint
 ↓
Socratic question
 ↓
Conceptual direction
 ↓
Pattern hint
 ↓
Algorithm hint
 ↓
Pseudocode
 ↓
Implementation guidance
 ↓
Full explanation
```

The student should be encouraged to remain at the lowest assistance level necessary.

See `AI_TUTOR_ENGINE.md` §8 for the canonical hint ladder definition.

---

# 10. System Design

System Design is a planned learning track.

Example progression:

```text
Requirements
 ↓
Components
 ↓
API
 ↓
Database
 ↓
Caching
 ↓
Load Balancing
 ↓
Scaling
 ↓
Reliability
 ↓
Trade-offs
```

The AI should teach this Socratically.

It should not immediately reveal the complete architecture.

---

# 11. Student Model

The student model should represent:

- Concept knowledge
- Pattern knowledge
- Problem-solving ability
- Confidence
- Mistakes
- Hint dependence
- Revision needs
- Performance history

---

# 12. Knowledge Dashboard

The student should be able to see:

- Topics learned
- Weak concepts
- Strong concepts
- Patterns learned
- Problems solved
- Independent solutions
- Hint usage
- Revision queue
- Confidence
- Progress

---

# 13. Revision System

The application should periodically revisit concepts.

Revision should use retrieval rather than simply showing the previous explanation again.

---

# 14. Voice Interaction

Students should be able to explain reasoning verbally.

Pipeline:

```text
Voice
 ↓
Speech-to-Text
 ↓
Reasoning Evaluation
 ↓
Knowledge State Update
 ↓
Tutor Response
```

Voice is primarily intended to reduce response friction.

---

# 15. Gamification

Gamification should support learning rather than distract from it.

Potential features:

- Streaks
- Milestones
- Concept mastery
- Practice goals
- Progress visualization
- Challenge sessions

Avoid meaningless point inflation.

---

# 16. Product Non-Goals

The application should NOT become:

- A generic chatbot
- A solution generator
- A video streaming platform
- A copy of LeetCode
- A copy of an existing DSA website
- A passive course library

The unique value is the adaptive tutoring engine.

---

# 17. MVP

The MVP should contain:

1. Authentication
2. Basic dashboard
3. Small DSA curriculum
4. Concept model
5. AI tutor
6. Socratic questioning
7. Student response
8. Knowledge state
9. Prerequisite diagnosis
10. Basic progress tracking

Everything else can be layered afterward.