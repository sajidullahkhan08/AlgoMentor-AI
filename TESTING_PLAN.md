# TESTING PLAN

# 1. Purpose

Ensure that the application is reliable, especially in the adaptive tutoring logic.

---

# 2. Unit Tests

Test:

- Knowledge state transitions
- Prerequisite resolution
- Hint escalation
- Difficulty calculation
- Progress calculations
- Pattern matching
- Validation
- Utility functions

---

# 3. Integration Tests

Test:

- Authentication
- Database operations
- Tutor sessions
- AI provider integration
- Problem submission
- Progress updates

---

# 4. UI Tests

Test:

- Navigation
- Learning flow
- Answer submission
- Hint requests
- Code interaction
- Error states

---

# 5. AI Evaluation

AI behavior should be evaluated using predefined scenarios.

Example:

Input:

> Student incorrectly explains binary search.

Expected behavior:

- Detect misunderstanding.
- Avoid immediately revealing complete solution.
- Identify relevant prerequisite.
- Ask an appropriate follow-up.

---

# 6. Regression Tests

Important tutor behaviors should have repeatable test cases.

Whenever an AI prompt or tutor algorithm changes, run regression tests.

---

# 7. Manual Testing

Important mobile workflows should be tested on actual devices where possible.

---

# 8. Performance

Monitor:

- Screen load time
- API latency
- AI response latency
- Database query latency
- Memory usage
- Mobile rendering performance

---

# 9. Security Testing

Test:

- Authentication
- Authorization
- Input validation
- API abuse
- Secret exposure
- Database access
- User data isolation

---

# 10. Automated Verification Test Suite Inventory

The project features **159 automated assertions across nine suites**, executed with `tsx` through `npm test`:

| Test Suite File | Scope / Focus | Assertion Count | Status |
|---|---|---|---|
| `backend/src/test_adaptive_tutoring.ts` | Multi-select, ordering, prerequisite descent/ascent, confidence calibration | 21 / 21 | **PASS** |
| `backend/src/test_problem_solving.ts` | Test-case runner, sandbox behavior, AI complexity review | 18 / 18 | **PASS** |
| `backend/src/test_interactive_visualizers.ts` | BST traversals, Graph BFS/DFS, Two-Pointer window, DP Matrix, Big-O scales | 17 / 17 | **PASS** |
| `backend/src/test_voice_reasoning.ts` | Spoken reasoning evaluation, transcript validation, edge cases, delivery feedback | 15 / 15 | **PASS** |
| `backend/src/test_spaced_repetition.ts` | SuperMemo SM-2 interval expansion, Ease Factor penalties, 5-box Leitner transitions | 25 / 25 | **PASS** |
| `backend/src/test_system_design.ts` | Scale scenarios, back-of-the-envelope math, architecture topology, trade-off evaluation | 21 / 21 | **PASS** |
| `backend/src/test_code_execution_security.ts` | Valid/wrong output, syntax errors, per-test and top-level timeouts, blocked globals/eval, input limits, non-JS rejection | 11 / 11 | **PASS** |
| `backend/src/test_api_security.ts` | Bearer-token enforcement, rate-limit budget/isolation/headers, 413/400/generic 500 without leaks | 10 / 10 | **PASS** |
| `backend/src/test_progress_persistence.ts` | Durable attempts/revision/misconceptions, cross-process persistence, progress totals, streaks, recommendations | 21 / 21 | **PASS** |
| **Total** | **Full System Verification** | **159 / 159** | **100% PASS** |

### Running the Test Suites

Execute from the `backend/` directory:

```bash
npm test
```

Individual suites can be run with `npx tsx src/test_<name>.ts`. Tests use the deterministic mock AI provider when `GEMINI_API_KEY` is empty and fall back to a local JSON store when Supabase is unreachable, so the suite requires no live credentials. The persistence and revision suites point `LOCAL_STORE_PATH` at a unique OS temp file, so repeated local runs start from a clean state and are deterministic.

### Static Type Checking

Verify zero compilation errors across the workspace:

```bash
cd backend && npm run typecheck
cd mobile && npm run typecheck
```

### Continuous Integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs the backend typecheck/tests and the mobile typecheck plus `expo export --platform web` on every push to `main` and every pull request, using placeholder Supabase credentials and no AI key.

### Known Gaps

- No automated React Native UI tests; screen-level workflows require manual/device verification.
- The backend tests exercise middleware and services directly; they do not run against a live Supabase project.
- Docker image and EAS build execution are documented but were not run in the development environment.