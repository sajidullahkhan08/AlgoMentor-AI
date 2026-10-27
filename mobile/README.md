# AlgoMentor AI — Mobile App

Expo SDK 57 / React Native 0.86 / Expo Router client for the AlgoMentor AI adaptive learning platform.

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # fill in Supabase URL/key and backend API URL
npm start
```

`EXPO_PUBLIC_API_URL` must include `/api` (for example `http://192.168.1.20:3000/api`). On a physical device via Expo Go, a `localhost` API URL is ignored and the dev machine's LAN IP is auto-detected; set a real URL for builds.

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Expo dev server |
| `npm run android` / `npm run ios` / `npm run web` | Platform-specific dev |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Expo lint |
| `npx expo export --platform web` | Static web bundle in `dist/` |

## Screens

- Auth (login/register) and profile
- Dashboard with real progress metrics (`/progress/summary`)
- Curriculum: course → topic → concept
- Socratic tutor sessions with confidence calibration and hint ladder
- Problems catalog, workspace, code runner, 3-tier hints, AI review
- Mental-model visualizers
- Verbal reasoning studio
- Revision and spaced repetition
- System design studio

## Packaging

EAS profiles live in [`eas.json`](eas.json). Production builds require `EXPO_PUBLIC_*` values to be configured as EAS environment variables and a real API URL. See the root [`DEPLOYMENT.md`](../DEPLOYMENT.md).

## Notes

- Web Speech API transcription only works in browsers; native builds show keyboard dictation/text entry.
- The app expects the backend to be reachable and the Supabase project to have migrations 001, 003, 004, and 005 applied (see root deployment guide).
