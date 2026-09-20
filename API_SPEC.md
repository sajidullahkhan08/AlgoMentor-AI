# API SPECIFICATION

This file records the application's backend API contract.

The API should evolve alongside implementation.

---

# Authentication

Potential endpoints:

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

---

# Courses

```text
GET /courses
GET /courses/:id
GET /courses/:id/modules
```

---

# Concepts

```text
GET /concepts/:id
GET /concepts/:id/prerequisites
GET /concepts/:id/problems
```

---

# Tutor

```text
POST /tutor/session
POST /tutor/session/:id/respond
POST /tutor/session/:id/hint
GET  /tutor/session/:id
```

---

# Student Knowledge

```text
GET /student/knowledge
GET /student/knowledge/:conceptId
```

---

# Problems

```text
GET /problems
GET /problems/:id
POST /problems/:id/attempt
```

---

# Progress

```text
GET /progress
GET /progress/weak-topics
GET /progress/revision
```

---

# System Design

Potentially:

```text
GET /system-design/topics
GET /system-design/problems
POST /system-design/session
```

---

# API Principles

- Validate inputs.
- Authenticate protected routes.
- Never expose secrets.
- Use consistent errors.
- Use structured responses.
- Avoid exposing raw internal AI prompts.
- Rate-limit expensive AI operations.