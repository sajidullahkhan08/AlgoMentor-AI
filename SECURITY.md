# SECURITY

# 1. General Principles

The application should protect:

- User accounts
- Learning history
- AI conversations
- Code submissions
- API credentials
- Personal information

---

# 2. Secrets

Never commit:

- API keys
- Database passwords
- Authentication secrets
- Private tokens

Use environment variables.

---

# 3. Authentication

Protected resources verify a Supabase JWT via `Authorization: Bearer <token>` (`backend/src/middleware/authenticate.ts`). `/api/tutor`, `/api/revision`, `/api/progress`, profile updates, problem execution/submission/hints, and system-design evaluation all require authentication. There is no optional/guest bypass.

---

# 4. Authorization

A user must only access their own:

- Profile
- Learning state
- Progress
- Conversations
- Attempts

---

# 5. AI API Keys

AI keys should remain server-side whenever possible.

Do not expose privileged provider keys inside the mobile application.

---

# 6. Input Validation

Validate:

- User input
- API requests
- Code submissions
- AI structured output

---

# 7. Code Execution

Implemented in Phase 5 and hardened in Phase 11 via `CodeRunner` (`backend/src/services/codeRunner.ts` and `backend/codeRunnerWorker.cjs`, resolving DEC-DEF-01):

- Each submission runs in a separate Node.js child process, never in the Express process.
- The child uses `vm.createContext` with `codeGeneration: { strings: false, wasm: false }` and `microtaskMode: 'afterEvaluate'`.
- `process`, `require`, `module`, `fs`, `fetch`, `XMLHttpRequest`, `WebSocket`, `ChildProcess`, and `Buffer` are unavailable; dynamic `eval`/`Function` is blocked.
- Each test invocation has a VM timeout (default 1,000 ms, clamped 100–5,000 ms).
- The parent enforces a hard wall-clock timeout (`tests × timeout + 3s`, capped at 30s) and kills the worker.
- The worker runs with `--max-old-space-size=128`, a minimal environment, and capped stdout/stderr/output (1 MB).
- Only JavaScript (`javascript` / `js`) is accepted; other languages return HTTP 400 before execution.
- Code length is capped at 50,000 characters; submitted values are JSON-cloned per test.
- Errors and outputs are sanitized before being returned.

---

# 8. Privacy

Store only information necessary for application functionality.

Avoid collecting unnecessary personal information.

---

# 9. Rate Limiting

`backend/src/middleware/rateLimit.ts` implements dependency-free fixed-window limits keyed by authenticated user ID (falling back to client IP):

- Global API: 300 requests/minute.
- Code execution (`/run`, `/submit`): 20 requests/minute.
- AI operations (tutor, voice, review/evaluation): 20 requests/minute.
- Practice/revision writes and hints: 60 requests/minute.

Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` on HTTP 429. Limits are in-memory and per instance; use a shared store when scaling horizontally.

---

# 10. Error Messages

Do not expose:

- Stack traces
- Database details
- API keys
- Internal prompts
- Infrastructure information

to normal users.

`backend/src/middleware/errorHandler.ts` returns generic messages for unexpected failures, HTTP 400 for malformed JSON, and HTTP 413 for bodies over 128 KB. Route handlers sanitize provider/database errors before responding; only server-side logs contain details.

---

# 11. Transport & Browser Hardening

- CORS uses an explicit `CORS_ORIGINS` allowlist in production; native/server clients send no `Origin` and remain unaffected.
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-site`, restrictive `Permissions-Policy`, and HSTS in production.
- `x-powered-by` is disabled.
- JSON bodies are capped at 128 KB and must be strict JSON.
- TLS must terminate at the proxy/load balancer.

---

# 12. Learner Data at Rest

Supabase is the source of truth when migrations 003–005 are applied. When they are absent (or a database call fails), attempts, revision items/logs, and misconceptions persist to a local JSON store at `LOCAL_STORE_PATH` (default `backend/data/local-store.json`). This file is gitignored, written atomically, and must be placed on a persistent volume. It is single-process only; do not share it across instances.