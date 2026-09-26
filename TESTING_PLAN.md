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

The project features a comprehensive suite of **117 automated unit and integration assertions** executing in Node.js via `ts-node`:

| Test Suite File | Scope / Focus | Assertion Count | Status |
|---|---|---|---|
| `backend/src/test_adaptive_tutoring.ts` | Multi-select, ordering, prerequisite descent/ascent, confidence calibration | 21 / 21 | **PASS** |
| `backend/src/test_problem_solving.ts` | Sandboxed Node.js VM context, timeout enforcement, test-case runner, AI complexity review | 18 / 18 | **PASS** |
| `backend/src/test_interactive_visualizers.ts` | BST traversals, Graph BFS/DFS, Two-Pointer window, DP Matrix, Big-O scales | 17 / 17 | **PASS** |
| `backend/src/test_voice_reasoning.ts` | Spoken reasoning evaluation, transcript validation, edge cases, delivery feedback | 15 / 15 | **PASS** |
| `backend/src/test_spaced_repetition.ts` | SuperMemo SM-2 interval expansion, Ease Factor penalties, 5-box Leitner transitions | 25 / 25 | **PASS** |
| `backend/src/test_system_design.ts` | Scale scenarios, back-of-the-envelope math, architecture topology, trade-off evaluation | 21 / 21 | **PASS** |
| **Total** | **Full System Verification** | **117 / 117** | **100% PASS** |

### Running the Test Suites

Execute from the `backend/` directory:

```bash
npx ts-node src/test_adaptive_tutoring.ts
npx ts-node src/test_problem_solving.ts
npx ts-node src/test_interactive_visualizers.ts
npx ts-node src/test_voice_reasoning.ts
npx ts-node src/test_spaced_repetition.ts
npx ts-node src/test_system_design.ts
```

### Static Type Checking

Verify zero compilation errors across the workspace:

```bash
cd backend && npx tsc --noEmit
cd mobile && npx tsc --noEmit
```