# CONTENT SYSTEM

# 1. Purpose

Defines how educational content enters and is represented inside the application.

This document corresponds to the **Curriculum/Content** module in the system architecture (see `ARCHITECTURE.md` §4).

---

# 2. Content Sources

Potential sources:

- Open educational resources
- Public DSA curricula
- Public algorithm resources
- Licensed datasets
- Original project-authored explanations
- Public problem metadata where permitted

External proprietary content must not be copied without permission.

---

# 3. Content Types

- Course
- Module
- Topic
- Concept
- Example
- Pattern
- Problem
- Hint
- Explanation
- Quiz
- Challenge
- System Design exercise

---

# 4. Content Metadata

Every concept should ideally contain:

- ID
- Name
- Description
- Prerequisites
- Learning objectives
- Difficulty
- Examples
- Common misconceptions
- Related patterns
- Related problems
- Assessment methods

---

# 5. Content vs AI

Static curriculum knowledge should not depend entirely on the LLM.

The database should contain structured educational metadata.

The AI can dynamically generate:

- Questions
- Hints
- Variations
- Examples
- Follow-up prompts

---

# 6. Content Quality

AI-generated educational content should be validated.

Particularly for:

- Algorithms
- Complexity
- Code
- Mathematical reasoning
- System Design
- Technical claims

---

# 7. Problem Content

Problem records should include:

- Title
- Description
- Difficulty
- Topics
- Patterns
- Constraints
- Examples
- Test cases where legally/technically appropriate
- Expected concepts
- Hint levels

---

# 8. Curriculum Organization

Initial curriculum should be intentionally small.

Do not attempt to populate thousands of problems before the tutoring system works.

A small high-quality dataset is preferable to a huge unvalidated dataset.