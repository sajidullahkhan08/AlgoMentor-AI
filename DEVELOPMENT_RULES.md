# DEVELOPMENT RULES

These rules apply to all AI agents and developers.

---

# 1. Understand Before Modifying

Before changing code:

- Inspect repository structure.
- Search existing implementations.
- Read relevant documentation.
- Understand dependencies.
- Understand the current behavior.

Do not guess.

---

# 2. Do Not Rewrite Unnecessarily

Do not replace working code merely because another implementation looks cleaner.

Prefer incremental improvement.

---

# 3. Preserve Architecture

Major architectural changes require:

1. Reason
2. Documentation
3. Decision record

Update `DECISIONS.md`.

---

# 4. Keep Features Modular

Avoid massive files.

Separate:

- UI
- Business logic
- AI logic
- Database logic
- API communication
- Types
- Tests

---

# 5. Never Hard-Code Secrets

API keys and credentials must never be committed.

Use environment variables/secrets.

---

# 6. Validate AI Output

Never blindly trust model output.

Validate structured AI responses.

Handle malformed responses.

---

# 7. AI Is Not the Database

Do not rely on the model's conversation memory for persistent application state.

Store important state in the database.

---

# 8. Test Important Logic

Especially test:

- Knowledge state transitions
- Prerequisite logic
- Hint escalation
- Interaction selection
- API validation
- Authentication
- Progress calculation

---

# 9. Mobile First

The primary interaction model is mobile.

Avoid interfaces that require desktop-sized layouts.

---

# 10. Minimize Response Friction

Whenever a feature requires student input, ask:

> Can this be answered more naturally through a choice, interaction, voice, or short response?

But never remove the reasoning requirement merely to make the application easier.

---

# 11. Don't Over-Engineer

This is a student/FYP project.

Choose the simplest architecture that supports the required functionality.

---

# 12. Documentation Is Part of Development

When architecture or important behavior changes, documentation must be updated.

---

# 13. Handoff

Before finishing a development session:

- Update `TASKS.md`
- Update `PROJECT_MEMORY.md`
- Update `CHANGELOG.md`
- Record important decisions
- Record unresolved issues

---

# 14. Never Claim Completion Without Verification

An agent should not say:

> "Feature completed"

unless it has actually implemented and tested the relevant behavior.