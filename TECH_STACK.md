# TECHNOLOGY STACK

This file records the actual technology stack.

The stack should prioritize:

1. Free availability
2. Stability
3. Developer productivity
4. Maintainability
5. Replaceability
6. Suitability for an academic project

---

# 1. Frontend

- React Native 0.86
- Expo SDK 57
- TypeScript 6
- Expo Router (file-based routing)

Status:

**Implemented** (`mobile/`)

---

# 2. Backend

- Node.js
- TypeScript
- Express 5

Decision: DEC-PEN-01 (Accepted)

Status:

**Implemented** (`backend/`)

---

# 3. Database

- PostgreSQL (via Supabase)
- Supabase client library (backend: service role; mobile: anon key)

Status:

**Schema defined** — migrations ready to run (`backend/supabase/migrations/`)

---

# 4. Authentication

- Supabase Auth (client-side SDK)
- Backend validates Supabase JWTs

Decision: DEC-PEN-02 (Accepted), DEC-PEN-03 (Accepted)

Status:

**Implemented** — auth context (mobile) + JWT middleware (backend)

---

# 5. AI

Primary candidate:

- Gemini API

Fallback strategy:

- AI provider abstraction
- Additional free/open providers if necessary
- Local/open-source model where practical

Status:

**Not yet implemented** — planned for Phase 2 (First Vertical Slice)

---

# 6. Development Tools

In use:

- VS Code / Google Antigravity
- Git
- npm

---

# 7. Deployment

Candidates:

- Cloudflare
- Supabase
- Other free hosting platforms

Status:

**Not finalized**

---

# 8. Important Rule

Never assume that a free-tier service provides unlimited usage.

Always verify current limits before relying on a service.

The application should minimize provider lock-in.