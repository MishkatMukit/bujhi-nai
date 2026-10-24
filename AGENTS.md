# AGENTS.md

## Repository state

This repo is a working full-stack app: Express + MongoDB API plus a Next.js frontend. Do not infer a package manager or command from missing files.

- Initial commit is on `main`; remote `origin` is `https://github.com/MishkatMukit/bujhi-nai.git`.
- `bujhi-nai-backend/` is scaffolded through Phase 7 of `backend.md` (all phases done): manifest, lockfile, TS/Biome/tsup config, config loader, `app.ts`/`server.ts`, shared utils/middleware, the board interface/model with both indexes, the Atlas connection, an idempotent seed, the read API, the Gemma integration (`lib/gemma.ts` + `scripts/test-gemma.ts`), `POST /api/boards/explain` with Multer uploads (`lib/multer.ts`), and `PATCH /api/boards/:id/helpful`. An automated test runner is still missing.
- `bujhi-nai-frontend/` is a working Next.js 16 App Router app (TypeScript, Tailwind v4, shadcn/ui, `react-markdown` + KaTeX + voice recording): chat-style single screen, composer with image/voice/notes, three-tab explanation viewer, mobile archive sheet and desktop archive rail. It has no CI or automated test runner yet.
- `.gitignore` ignores Node/Next/TS build output and `.env*` (except example files such as `.env.example` and `.env.local.example`), plus `plans.md` and `AGENTS.md`.

## Planning docs

- `plans.md` — original product/architecture plan. Its sections 4+ are collapsed into long lines; prefer the split docs below.
- `backend.md` — Express module layout, routes/controller/service rules, API, schema, Gemma service.
- `frontend.md` — Next.js layout, components, API client, voice/KaTeX behavior.

Read the relevant doc before scaffolding; do not invent a different structure.

## Working here

- Planned stack: Next.js App Router + TypeScript + Tailwind + shadcn/ui; Node/Express + TypeScript + MongoDB Atlas/Mongoose; Gemma 4 via `@google/genai` (Ollama fallback).
- Backend follows the `housely-backend` conventions: app code under `src/app/`, entry files `src/app.ts` + `src/server.ts`, modules at `src/app/modules/<name>/{<name>.route.ts,<name>.controller.ts,<name>.service.ts,<name>.validation.ts}`. Dependency direction is route → controller → service; controllers must not import Mongoose or Gemma directly.
- Backend responses go through `src/app/utils/sendResponse.ts` (`{ success, statusCode, message, data, meta? }`), expected failures use `AppError`, handlers use `catchAsync`, and Zod validation uses `validateRequest`/`validateQuery`/`validateParams`.
- Backend work is split into 7 phases in `backend.md`. Implement one phase per change, stop at its exit check, then update the status table; do not jump ahead.
- Use the real directory names `bujhi-nai-backend/` and `bujhi-nai-frontend/`; `plans.md` calls them `backend/` and `frontend/`.
- One manifest and one lockfile per app; add scripts here as each app is scaffolded.
- Keep generated files (`node_modules/`, `.next/`, `dist/`, `.env*`) ignored as new tooling appears.

## Backend commands

Run from `bujhi-nai-backend/` (npm):

| Task | Command |
| :--- | :--- |
| Install | `npm install` |
| Dev server | `npm run dev` (`tsx watch`, `http://localhost:5000`) |
| Build | `npm run build` (`tsup` → `dist/`) |
| Production start | `npm start` (`node dist/server.js`) |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) |
| Lint / format | `npm run lint` / `npm run format` (Biome) |
| Seed | `npm run seed` (idempotent; three sample boards) |
| Gemma smoke test | `npx tsx src/scripts/test-gemma.ts` (hosted Gemma, falls back to Ollama) |

The server needs a local `.env` (copy `.env.example`); it refuses to start without `MONGODB_URI` and `GEMINI_API_KEY`. No test runner is chosen yet.

## Frontend commands

Run from `bujhi-nai-frontend/` (npm):

| Task | Command |
| :--- | :--- |
| Install | `npm install` |
| Dev server | `npm run dev` (`http://localhost:3000`) |
| Build | `npm run build` |
| Production start | `npm run start` |
| Lint | `npm run lint` (ESLint) |
| Typecheck | `npx tsc --noEmit` |

The frontend needs a local `.env.local` (copy `.env.local.example`) with `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000/api`). Start the backend first; the app fetches the archive and calls `POST /api/boards/explain`. Printing uses a dedicated body-level `PrintSheet` because the chat shell is fixed-height and overflow-hidden. No test runner is chosen yet.
