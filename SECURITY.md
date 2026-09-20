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

If the application eventually executes student code remotely, use an isolated/sandboxed execution environment.

Never execute arbitrary student code directly inside the main application server.

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