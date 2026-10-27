# AlgoMentor AI — Deployment Guide

Two deployables share this repository:

| Component | Path | Runtime | Hosting |
| --- | --- | --- | --- |
| Backend API | [`backend/`](backend) | Node.js 22+, Express 5, TypeScript | Docker container / any Node host |
| Mobile app | [`mobile/`](mobile) | Expo SDK 57, React Native + web | EAS Build, Expo web static export |

Supabase provides authentication and Postgres for both. The Gemini API key is optional; without it the backend uses the deterministic mock provider.

---

## 1. Supabase setup

1. Create a Supabase project and note the project URL, anon key, and service role key.
2. In the SQL editor, apply the schema migrations **in order**:
   - `backend/supabase/migrations/001_foundation.sql`
   - `backend/supabase/migrations/003_problems_and_patterns.sql`
   - `backend/supabase/migrations/004_revision_system.sql`
   - `backend/supabase/migrations/005_system_design.sql`

   `002_seed_data.sql` is the legacy minimal seed and is **not** needed for new deployments — the canonical curriculum seeder below supersedes it.

   Migrations 003–005 are required for database-backed problem attempts, revision items, and system-design scenarios. Without them the API remains usable: attempts, revision state, and misconceptions fall back to a durable JSON store on the backend (`LOCAL_STORE_PATH`).
3. Seed the canonical curriculum from `backend/`:

   ```bash
   npm install
   npm run seed:curriculum
   ```

   The seeder is idempotent (deterministic UUIDs + upsert). It seeds courses, modules, topics, concepts, prerequisite relationships, DSA patterns, and problems. A successful run ends with:

   ```
   Verified 40 concepts, 15 patterns, and 30 problems in the database. Curriculum seed complete.
   ```

   Expected canonical content: 3 courses, 12 modules, 17 topics, 40 concepts, 30 prerequisite relationships, 30 problems, 15 patterns.
4. Ensure email auth is enabled if learners sign in with email/password (the mobile app's current flow).

---

## 2. Backend configuration

Copy `backend/.env.example` to `backend/.env` and fill in the values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Project URL. `/rest/v1` suffixes are stripped automatically. |
| `SUPABASE_ANON_KEY` | Yes | Used to verify user JWTs. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side data access. **Never** ship this to the mobile app. |
| `PORT` | No | Defaults to `3000`. |
| `NODE_ENV` | No | Set to `production` when deployed. |
| `CORS_ORIGINS` | In production | Comma-separated browser origins, e.g. `https://app.algomentor.ai`. Native apps send no `Origin` and are unaffected. Requests from unlisted origins are rejected. |
| `GEMINI_API_KEY` | No | When empty or the placeholder, the mock AI provider is used. |
| `LOCAL_STORE_PATH` | No | Durable fallback store path. Defaults to `./data/local-store.json` relative to the process working directory. |
| `TRUST_PROXY` | No | Set to `true` only when running behind exactly one reverse proxy/load balancer so IP rate limits use `X-Forwarded-For`. Leave unset when directly internet-facing. |

Start locally:

```bash
cd backend
npm install
npm run dev          # tsx watch
# or
npm run build && npm start
```

Verify: `GET http://localhost:3000/api/health` returns `{"status":"ok",...}`.

---

## 3. Backend with Docker

```bash
docker build -t algomentor-backend ./backend
docker run -d --name algomentor-api \
  -p 3000:3000 \
  --env-file backend/.env \
  -e NODE_ENV=production \
  -v algomentor-data:/app/data \
  algomentor-backend
```

Notes:

- The image runs as the non-root `node` user and includes a healthcheck against `/api/health`.
- Mount a volume at `/app/data`. The fallback store lives there when optional migrations are absent or a Supabase call fails, and learner data must survive container recreation.
- The sandboxed JavaScript runner spawns a resource-capped child process (`codeRunnerWorker.cjs`). Do not set a container memory limit below roughly 256 MB; each run is capped at 128 MB.
- Set `CORS_ORIGINS` in the deployment environment when a browser client calls the API.
- Terminate TLS at your proxy/load balancer. HSTS is emitted automatically when `NODE_ENV=production`.
- Set `TRUST_PROXY=true` when exactly one proxy sits in front of the API so per-IP rate limits see real client addresses. Do not enable it on a directly exposed instance.

---

## 4. Mobile configuration and builds

Copy `mobile/.env.example` to `mobile/.env` for local development:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for clients; RLS still applies). |
| `EXPO_PUBLIC_API_URL` | Backend base URL **including** `/api`, e.g. `https://api.algomentor.ai/api`. |

On a physical device, an API URL containing `localhost` is ignored so Expo Go can auto-detect the development machine; always set a real URL for builds.

Local development:

```bash
cd mobile
npm install
npm start            # Expo dev server
npm run web          # web preview
npm run typecheck
```

Production builds (EAS):

```bash
cd mobile
npx eas-cli login
npx eas-cli build --platform all --profile production
npx eas-cli submit --platform all --profile production
```

`mobile/eas.json` defines `preview` (internal distribution, Android APK) and `production` profiles. Configure `EXPO_PUBLIC_*` values as EAS environment variables (or in the build profile's `env`) so production bundles point at the deployed API and Supabase project. Update `ios.bundleIdentifier` / `android.package` in `mobile/app.json` if `com.algomentor.ai` is not the intended application ID. Local development continues to use Expo Go, so `expo-dev-client` is not required.

Web export:

```bash
cd mobile
npx expo export --platform web
```

The static output is written to `mobile/dist/` and can be hosted on any static host. Set `CORS_ORIGINS` on the backend to the web app's origin.

Voice reasoning uses the browser Web Speech API on web only; on native builds it presents keyboard dictation/text entry. No additional native permissions are required.

---

## 5. Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on pushes to `main` and on pull requests:

- **Backend:** `npm ci`, `npm run typecheck`, `npm test` (nine suites, including code-execution sandbox, API middleware security, and durable progress/persistence tests). CI uses placeholder Supabase credentials and no Gemini key, so the mock provider and local fallbacks are exercised.
- **Mobile:** `npm ci`, `npm run typecheck`, `npx expo export --platform web`.

The workflow needs no repository secrets because it never contacts Supabase or Gemini.

---

## 6. Security and operations checklist

- [ ] Supabase service role key exists only in backend environment variables.
- [ ] `.env` files are untracked; only `.env.example` is committed.
- [ ] `CORS_ORIGINS` lists the deployed web origin(s).
- [ ] TLS terminates in front of the API; `NODE_ENV=production`.
- [ ] `/app/data` is on a persistent volume.
- [ ] Migrations 001, 003, 004, 005 applied and `npm run seed:curriculum` completed.
- [ ] Health endpoint monitored (`/api/health`).
- [ ] Rate limits understood: global 300 req/min per IP, code execution 20/min, AI 20/min, practice writes 60/min. In-memory limits are per instance; use a shared store if you scale horizontally.

## 7. Known constraints

- Code execution supports JavaScript/TypeScript-style JavaScript only. Other languages are rejected with HTTP 400.
- Rate limiting is in-memory and resets on restart.
- The local fallback store is single-instance JSON (atomic writes, but not multi-node safe). Prefer the Supabase tables for multi-instance deployments.
- Data written to the local store is not automatically imported into Supabase if migrations are applied later.
