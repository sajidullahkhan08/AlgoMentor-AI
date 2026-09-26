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

Protected resources must verify authentication.

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

Implemented in Phase 5 via `CodeRunner` (`backend/src/services/codeRunner.ts`, resolving DEC-DEF-01):

- Executes code in an isolated Node.js `vm.createContext` environment.
- The global execution context is sanitized: `process`, `require`, `fs`, `fetch`, `XMLHttpRequest`, `WebSocket`, `ChildProcess`, and `Buffer` are stripped or denied.
- Enforces a strict 1,000ms wall-clock timeout per test execution to prevent infinite loops, hangs, or resource starvation.
- Memory ceiling and input/output deep JSON comparisons are enforced safely.
- Never runs untrusted code in the primary uncontained Express process context.

---

# 8. Privacy

Store only information necessary for application functionality.

Avoid collecting unnecessary personal information.

---

# 9. Rate Limiting

AI operations can be expensive and limited by provider quotas.

Rate-limit abuse and accidental request loops.

---

# 10. Error Messages

Do not expose:

- Stack traces
- Database details
- API keys
- Internal prompts
- Infrastructure information

to normal users.