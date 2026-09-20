# SYSTEM ARCHITECTURE

# 1. Architectural Goal

Build a modular application where:

- Mobile UI
- Backend
- AI
- Knowledge model
- Curriculum
- Student state
- Authentication
- Database

are sufficiently separated to allow independent evolution.

---

# 2. High-Level Architecture

```text
                    React Native App
                           │
                           ↓
                     API / Backend
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
 Authentication     Tutor Engine        Curriculum /
                           │              Content
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
       Student Model  Knowledge Graph  AI Provider
             │             │             │
             └─────────────┼─────────────┘
                           ↓
                        Database
```

All server-side components (Authentication, Tutor Engine, Curriculum/Content, Student Model, Knowledge Graph, AI Provider) are modules within the backend. They are shown separately for clarity, not to imply separate services.

---

# 3. Frontend

Initial direction:

- React Native
- Expo
- TypeScript

Responsibilities:

- Navigation
- Screens
- Interaction UI
- Local state
- API communication
- Audio/voice UI
- Code editor
- Visualizations
- Progress visualization

---

# 4. Backend

The backend is a single application containing several modules.

Direct backend responsibilities:

- Authentication integration
- User data management
- API routing, validation, and error handling
- Rate limiting
- Security

Delegated to the Tutor Engine module (see `AI_TUTOR_ENGINE.md`):

- Learning session orchestration
- Knowledge state management
- Interaction selection
- AI provider calls
- Prerequisite navigation
- Hint escalation

Delegated to the Curriculum/Content module (see `CONTENT_SYSTEM.md`):

- Course, module, topic, and concept data
- Problem data
- Pattern data

---

# 5. AI Layer

The AI layer is isolated behind an abstraction so that providers can be replaced without changing the Tutor Engine logic.

```text
Tutor Engine
     ↓
AI Provider Interface
     ↓
Provider (Gemini / other)
```

The AI Provider is a service that the Tutor Engine calls. It is not a peer of the Student Model or Knowledge Graph — it sits behind the Tutor Engine.

See `AI_TUTOR_ENGINE.md` §10 for the provider interface definition.

---

# 6. Database

Initial preference:

PostgreSQL.

Supabase may provide:

- Database
- Authentication
- Storage
- APIs

depending on the final architecture.

---

# 7. Local State

Only temporary/UI state should be stored locally unless there is a clear reason otherwise.

Examples:

- Current screen state
- Draft response
- Current interaction
- UI preferences

Persistent learning state should be server-side.

---

# 8. Client / Server Boundary

The following operations happen **server-side** (via API calls):

- All Tutor Engine logic (interaction selection, prerequisite descent, hint escalation)
- Knowledge state computation and storage
- AI provider calls (keys must never be client-side)
- Session persistence
- Progress calculation

The following operations happen **client-side**:

- Rendering interaction UI (MCQ, ordering, code editor, etc.)
- Collecting student responses
- Displaying tutor messages
- Navigation and screen state
- Loading/streaming state management
- Audio recording (voice input)
- Visualizations and animations

---

# 9. Offline Considerations

Offline functionality is not initially required.

Potential future offline capabilities:

- Cached curriculum
- Previously loaded questions
- Local progress queue
- Offline code practice

---

# 10. Scalability

The initial project is educational rather than production-scale.

Do not over-engineer for millions of users.

However, avoid architecture that makes reasonable future expansion impossible.

---

# 11. Modularity

Features should be modular.

Prefer:

```text
feature/
├── components/
├── screens/
├── hooks/
├── services/
├── types/
└── tests/
```

Exact structure may change based on implementation experience.